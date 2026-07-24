import Stripe from 'stripe';

/**
 * Stripe client (lazy-init).
 *
 * We lazy-initialise so the module can be imported at build time without
 * STRIPE_SECRET_KEY being set (Vercel runs `next build` without runtime
 * env vars unless they are explicitly exposed). The actual client is
 * only created the first time a route handler calls `getStripe()`.
 */

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY no está configurado. Añádelo en Vercel → Settings → Environment Variables.'
    );
  }

  _stripe = new Stripe(key, {
    // Stripe JS SDK: si no se pasa apiVersion, usa la última por defecto
    // y evita errores de tipo cuando el SDK se actualiza.
    typescript: true,
  });
  return _stripe;
}

/** Alias de getStripe para conveniencia */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripe();
    // @ts-expect-error — proxy dinámico
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export async function getOrCreateCustomer(email: string, userId: string): Promise<string> {
  const client = getStripe();
  // Buscar customer existente por metadata
  const existing = await client.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  // Crear nuevo customer
  const customer = await client.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}
