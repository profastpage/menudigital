import { MercadoPagoConfig, PreApproval } from 'mercadopago';

/**
 * MercadoPago client (lazy-init).
 *
 * Inicializa el cliente solo en el primer acceso para evitar errores
 * durante `next build` (Vercel no expone las env vars de runtime en build).
 *
 * Documentación:
 * - Subscriptions (PreApproval): https://www.mercadopago.com/developers/en/reference/subscriptions/preapproval/_preapproval/post
 * - Webhooks: https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
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

  // El modo sandbox se controla con el prefijo del access token:
  //   TEST-xxx  → sandbox
  //   APP_USR-xxx → producción
  // MERCADOPAGO_SANDBOX es solo informativo (no se pasa al SDK).
  _client = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 15000 },
  });
  return _client;
}

/** Moneda por defecto — ajusta si vendes en otra región */
export const MP_CURRENCY = process.env.MERCADOPAGO_CURRENCY_ID || 'PEN';

export interface CreatePreapprovalInput {
  payerEmail: string;
  reason: string;
  amount: number; // monto mensual
  userId: string; // lo guardamos en external_reference
  backUrl?: string;
}

/**
 * Crea una suscripción (PreApproval) en MercadoPago.
 *
 * Devuelve `init_point` — la URL de Checkout Pro a la que se redirige
 * al cliente para que autorice el cobro recurrente.
 */
export async function createPreapproval(
  input: CreatePreapprovalInput
): Promise<{ id: string; initPoint: string }> {
  const client = getMP();
  const preApproval = new PreApproval(client);

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const response = await preApproval.create({
    body: {
      reason: input.reason,
      external_reference: input.userId, // clave para el webhook
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
  externalReference?: string;
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
 * Mapa de estados de MercadoPago → nuestro plan.
 *
 * Estados posibles del PreApproval:
 * - pending    → el comprador aún no completó el checkout
 * - authorized → suscripción activa (cobra cada mes)
 * - paused     → pausada por el vendedor
 * - cancelled  → cancelada (no se cobra más)
 */
export function preapprovalStatusToPlan(
  status: string
): 'free' | 'pro' {
  return status === 'authorized' ? 'pro' : 'free';
}
