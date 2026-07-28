import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getPreapproval, preapprovalStatusToPlan, verifyWebhookSignature } from '@/lib/mercadopago';
import { sendEmail } from '@/lib/email';
import { paymentConfirmedEmail } from '@/lib/email-templates';
import { getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { PLANS } from '@/lib/plans';

/**
 * POST /api/mercadopago/webhook
 *
 * Recibe notificaciones de MercadoPago (Webhooks API).
 *
 * Seguridad:
 * 1. Verifica firma HMAC (header x-signature) con MERCADOPAGO_WEBHOOK_SECRET.
 *    En producción, sin firma válida → 401.
 *    En desarrollo, se permite sin firma para pruebas locales.
 * 2. Idempotente: si el mismo webhook llega 2+ veces, no hay side-effects
 *    adicionales (el UPDATE a `profiles` es atómico y determinístico).
 * 3. Rate-limited por middleware global (ver src/middleware.ts).
 *
 * Body típico:
 * {
 *   "type": "subscription_preapproval",
 *   "data": { "id": "2C9323E0A..." },
 *   "live_mode": true
 * }
 */
export async function POST(req: NextRequest) {
  // Rate limiting: 60/minuto por IP (MP reintenta con backoff)
  const ip = getClientIP(req);
  const limited = rateLimitResponse(`mp-webhook:${ip}`, RATE_LIMITS.webhookMP);
  if (limited) return limited;

  let body: any;
  try {
    body = await req.json();
  } catch {
    // MercadoPago a veces envía form-encoded — tolerarlo
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  }

  const type: string = body?.type || body?.topic || '';
  const dataId: string | undefined = body?.data?.id || body?.id || body?.resource;

  // Verificación de firma HMAC (fail-closed en producción)
  const signatureHeader = req.headers.get('x-signature');
  const requestIdHeader = req.headers.get('x-request-id');
  const isValid = verifyWebhookSignature({
    signatureHeader,
    requestIdHeader,
    dataId,
  });

  if (!isValid) {
    console.warn('[MP webhook] FIRMA INVÁLIDA — rechazando', {
      type,
      dataId,
      hasSig: !!signatureHeader,
      hasReqId: !!requestIdHeader,
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // live_mode indica si es producción (true) o sandbox (false)
  const liveMode: boolean = body?.live_mode === true;
  console.log('[MP webhook] type:', type, 'id:', dataId, 'live_mode:', liveMode);

  if (type === 'subscription_preapproval' && dataId) {
    try {
      const info = await getPreapproval(dataId);
      const { plan, userId: userIdFromRef } = preapprovalStatusToPlan(
        info.status,
        info.externalReference
      );

      const supabase = await createClient();
      let userId: string | undefined = userIdFromRef || undefined;

      if (!userId) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('mp_preapproval_id', dataId)
          .single();
        userId = existing?.id;
      }

      if (!userId) {
        console.warn('[MP webhook] sin userId para preapproval', dataId);
        return NextResponse.json({ received: true, ignored: true });
      }

      // Calcular fin del período (1 mes desde el próximo cobro)
      let currentPeriodEnd: string | null = null;
      if (info.nextPaymentDate) {
        currentPeriodEnd = new Date(info.nextPaymentDate).toISOString();
      } else if (info.status === 'authorized') {
        // Si no hay fecha próxima, asumir +1 mes
        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      await supabase
        .from('profiles')
        .update({
          plan,
          mp_status: info.status,
          mp_preapproval_id: dataId,
          current_period_end: currentPeriodEnd,
        })
        .eq('id', userId);

      console.log(`[MP webhook] ✅ Usuario ${userId} → plan=${plan} status=${info.status}`);

      // ─── Notificación al super admin (solo cuando se autoriza el pago) ───
      // Usamos service client para bypass RLS en admin_notifications (no hay
      // sesión de admin en el contexto del webhook).
      if (info.status === 'authorized') {
        try {
          const serviceClient = createServiceClient();
          const planConfig = PLANS[plan];
          const planName = planConfig?.name || plan.toUpperCase();
          const amount = planConfig?.mpAmount || 0;
          const currency = process.env.MERCADOPAGO_CURRENCY_ID || 'PEN';
          const currencySymbol = currency === 'PEN' ? 'S/' : currency === 'USD' ? '$' : currency + ' ';

          // Buscar datos del usuario para incluir en la notificación
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

          const clientEmail = clientProfile?.email || info.payerEmail || '—';
          const clientName = clientProfile?.full_name || '—';
          const now = new Date();
          const dateStr = now.toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Lima',
          });

          const notifPayload = {
            type: 'new_subscription',
            title: `Nueva suscripción ${planName.toUpperCase()}`,
            message: `${clientName} (${clientEmail}) acaba de pagar ${currencySymbol}${amount.toFixed(2)} por el plan ${planName}. Fecha: ${dateStr}.`,
            metadata: {
              plan,
              plan_name: planName,
              amount,
              currency,
              user_email: clientEmail,
              user_name: clientName,
              user_id: userId,
              mp_preapproval_id: dataId,
              mp_status: info.status,
              next_payment_date: info.nextPaymentDate || null,
              current_period_end: currentPeriodEnd,
              payment_date: now.toISOString(),
            },
            level: 'success',
            related_user_id: userId,
            // target_admin_id: NULL → notificación para todos los super admins
          };

          if (serviceClient) {
            const { error: notifErr } = await (serviceClient
              .from('admin_notifications') as any)
              .insert(notifPayload);
            if (notifErr) {
              console.warn('[MP webhook] No se pudo insertar admin_notification:', notifErr.message);
            } else {
              console.log('[MP webhook] 🔔 Notificación al super admin insertada');
            }
          } else {
            // Fallback: usar el cliente normal (anon) — puede fallar si RLS bloquea.
            // Lo intentamos igual como best-effort.
            const { error: notifErr } = await (supabase
              .from('admin_notifications') as any)
              .insert(notifPayload);
            if (notifErr) {
              console.warn('[MP webhook] SUPABASE_SERVICE_ROLE_KEY no configurada o RLS bloqueó insert:', notifErr.message);
              console.warn('[MP webhook] 💡 Para habilitar notificaciones al admin, configura SUPABASE_SERVICE_ROLE_KEY en Vercel.');
            } else {
              console.log('[MP webhook] 🔔 Notificación al super admin insertada (vía cliente anónimo)');
            }
          }
        } catch (notifErr) {
          console.warn('[MP webhook] Error insertando notificación al admin:', notifErr);
        }
      }

      // Enviar email de confirmación si el pago fue autorizado
      if (info.status === 'authorized' && info.payerEmail) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .single();

          const emailContent = paymentConfirmedEmail({
            email: info.payerEmail,
            fullName: profile?.full_name || undefined,
            plan: plan.toUpperCase(),
            amount: 0, // No tenemos el monto en este evento — se podría consultar a MP
            currency: 'PEN',
            nextBillingDate: currentPeriodEnd
              ? new Date(currentPeriodEnd).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'Próximo mes',
            invoiceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/billing`,
          });
          await sendEmail({
            to: info.payerEmail,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            tags: ['payment-confirmed'],
          });
        } catch (emailErr) {
          // El email es best-effort; no rompe el webhook si falla
          console.warn('[MP webhook] No se pudo enviar email de confirmación:', emailErr);
        }
      }
    } catch (err) {
      console.error(
        '[MP webhook] error procesando preapproval',
        dataId,
        err
      );
      // No lanzamos 500: MercadoPago reintenta en cascada.
      // Devolvemos 200 para evitar reintentos en cascada de eventos que ya procesamos.
    }
  }

  if (type === 'payment' && dataId) {
    console.log('[MP webhook] payment event (no-op):', dataId);
  }

  return NextResponse.json({ received: true });
}
