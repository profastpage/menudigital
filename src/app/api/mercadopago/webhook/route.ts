import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPreapproval, preapprovalStatusToPlan } from '@/lib/mercadopago';

/**
 * POST /api/mercadopago/webhook
 *
 * Recibe notificaciones de MercadoPago (Webhooks API).
 *
 * Documentación:
 * https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
 *
 * Body típico:
 * {
 *   "type": "subscription_preapproval",
 *   "data": { "id": "2C9323E0A..." },
 *   "live_mode": true
 * }
 *
 * Otros tipos relevantes:
 * - subscription_preapproval_plan (cambios en el plan, no actuamos)
 * - payment (cada cobro mensual — opcional, podemos usarlo para
 *   detectar fallos de pago)
 *
 * Flujo:
 * 1. Si type === 'subscription_preapproval', fetch del PreApproval
 * 2. Mapear status → plan (authorized=pro, resto=free)
 * 3. Buscar usuario por mp_preapproval_id (o external_reference=userId)
 * 4. Actualizar profile
 */
export async function POST(req: NextRequest) {
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

  // MercadoPago expects 200 OK rápidamente; procesar async si hace falta
  // (no usamos colas aquí porque Supabase responde en ~50ms)

  console.log('[MP webhook] type:', type, 'id:', dataId);

  if (type === 'subscription_preapproval' && dataId) {
    try {
      const info = await getPreapproval(dataId);
      const plan = preapprovalStatusToPlan(info.status);

      // Buscar el usuario por preapproval_id (más fiable) o external_reference
      const supabase = await createClient();
      let userId: string | undefined = info.externalReference;

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
    } catch (err) {
      console.error(
        '[MP webhook] error procesando preapproval',
        dataId,
        err
      );
      // Devolver 200 para que MP no reintente infinitamente
      // (los errores de red sí conviene reintentar)
    }
  }

  // `payment` lo usamos solo para log — el status del preapproval
  // ya refleja si el pago falló (pasará a paused/cancelled)
  if (type === 'payment' && dataId) {
    console.log('[MP webhook] payment event (no-op):', dataId);
  }

  return NextResponse.json({ received: true });
}
