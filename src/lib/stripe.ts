import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

export async function getOrCreateCustomer(email: string, userId: string): Promise<string> {
  // Buscar customer existente por metadata
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  // Crear nuevo customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}
