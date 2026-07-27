import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import type { PlanId } from './plans';

/**
 * MercadoPago client (lazy-init).
 */

let _client: MercadoPagoConfig | null = null;

export function getMP(): MercadoPagoConfig {
  if (_client) return _client;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      'MERCADOPAGO_ACCESS_TOKEN no está configurado. ' +
        'Añádelo en Vercel → Settings → Environment Variables.'
    );
  }

  _client = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 15000 },
  });
  return _client;
}

export const MP_CURRENCY = process.env.MERCADOPAGO_CURRENCY_ID || 'PEN';

export interface CreatePreapprovalInput {
  payerEmail: string;
  reason: string;
  amount: number; // monto mensual
  userId: string; // lo guardamos en external_reference
  planId: PlanId; // Nuevo: plan a suscribir
  backUrl?: string;
}

/**
 * Crea una suscripción (PreApproval) en MercadoPago.
 * El planId se guarda en external_reference como "userId:planId"
 * para que el webhook sepa a qué plan ascender.
 */
export async function createPreapproval(
  input: CreatePreapprovalInput
): Promise<{ id: string; initPoint: string }> {
  const client = getMP();
  const preApproval = new PreApproval(client);

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Codificar planId en external_reference para el webhook
  const externalReference = `${input.userId}:${input.planId}`;

  const response = await preApproval.create({
    body: {
      reason: input.reason,
      external_reference: externalReference,
      payer_email: input.payerEmail,
      back_url: input.backUrl || `${origin}/dashboard/billing?success=1`,
      status: 'pending',
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: input.amount,
        currency_id: MP_CURRENCY,
      },
    },
  });

  if (!response.id || !response.init_point) {
    throw new Error('MercadoPago no devolvió id o init_point');
  }

  return { id: response.id, initPoint: response.init_point };
}

export interface PreapprovalInfo {
  id: string;
  status: string; // authorized | paused | cancelled | pending
  payerEmail?: string;
  nextPaymentDate?: string;
  externalReference?: string; // "userId:planId"
}

export async function getPreapproval(id: string): Promise<PreapprovalInfo> {
  const client = getMP();
  const preApproval = new PreApproval(client);
  const r = await preApproval.get({ id });
  return {
    id: r.id || id,
    status: r.status || 'unknown',
    payerEmail: r.payer_email,
    nextPaymentDate: r.next_payment_date,
    externalReference: r.external_reference,
  };
}

export async function cancelPreapproval(id: string): Promise<void> {
  const client = getMP();
  const preApproval = new PreApproval(client);
  await preApproval.update({ id, body: { status: 'cancelled' } });
}

/**
 * Verifica la firma HMAC de un webhook de MercadoPago.
 *
 * MercadoPago envía los headers:
 *   - x-signature: "ts=...,v1=..."
 *   - x-request-id: ID de la notificación
 *
 * El data.info.id es el ID del recurso (payment, subscription_preapproval, etc.)
 *
 * Fórmula oficial (template):
 *   template = "id:<id>;request-id:<request_id>;ts:<ts>;"
 *   signature = HMAC_SHA256(template, MERCADOPAGO_WEBHOOK_SECRET)
 *
 * Documentación oficial:
 *   https://www.mercadopago.com.pe/developers/es/docs/your-integrations/notifications/webhooks
 *
 * Si MERCADOPAGO_WEBHOOK_SECRET no está configurado, devuelve true en desarrollo
 * y false en producción (fail-closed).
 */
export function verifyWebhookSignature(params: {
  signatureHeader: string | null;
  requestIdHeader: string | null;
  dataId: string | undefined;
}): boolean {
  const { signatureHeader, requestIdHeader, dataId } = params;
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // Fail-closed en producción sin secret
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[MP webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado en producción');
      return false;
    }
    // En desarrollo, permitir sin verificación
    return true;
  }

  if (!signatureHeader || !dataId) return false;

  // Parsear "ts=...,v1=..."
  const parts = signatureHeader.split(',');
  let ts: string | null = null;
  let v1: string | null = null;
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k?.trim() === 'ts') ts = v?.trim();
    if (k?.trim() === 'v1') v1 = v?.trim();
  }
  if (!ts || !v1) return false;

  // Construir template
  const template = `id:${dataId};request-id:${requestIdHeader || ''};ts:${ts};`;

  // Calcular HMAC SHA256
  const crypto = require('crypto') as typeof import('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(template);
  const computed = hmac.digest('hex');

  // Comparación time-safe
  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Mapa de estados de MercadoPago → plan.
 *
 * Estados posibles del PreApproval:
 * - pending    → el comprador aún no completó el checkout
 * - authorized → suscripción activa (cobra cada mes)
 * - paused     → pausada por el vendedor
 * - cancelled  → cancelada (no se cobra más)
 *
 * Si estaba autorizado y deja de estarlo → vuelve a free.
 * Si está autorizado → conserva el plan indicado en external_reference.
 */
export function preapprovalStatusToPlan(
  status: string,
  externalReference?: string
): { plan: PlanId; userId: string | null } {
  // Intentar extraer planId del external_reference
  let planId: PlanId | null = null;
  let userId: string | null = null;

  if (externalReference) {
    const parts = externalReference.split(':');
    if (parts.length >= 2) {
      userId = parts[0];
      const p = parts[1] as PlanId;
      if (['free', 'pro', 'premium', 'full'].includes(p)) {
        planId = p;
      }
    } else {
      userId = externalReference;
    }
  }

  if (status === 'authorized') {
    // Si está autorizado, mantiene el plan del external_reference.
    // Fallback a 'pro' si no viene especificado (compat con suscripciones viejas).
    return { plan: planId || 'pro', userId };
  }

  // Si no está autorizado (pending, paused, cancelled) → free
  return { plan: 'free', userId };
}
