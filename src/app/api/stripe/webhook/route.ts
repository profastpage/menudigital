import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Sin signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.customer) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

          // Obtener la suscripción para saber el período actual
          let currentPeriodEnd: string | null = null;
          if (subscriptionId) {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString();
          }

          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              stripe_customer_id: typeof session.customer === 'string' ? session.customer : session.customer.id,
              stripe_subscription_id: subscriptionId || null,
              stripe_price_id: PLANS_PRO_PRICE_ID,
              current_period_end: currentPeriodEnd,
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        // Si la suscripción está cancelada o expirada
        if (sub.status === 'canceled' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
          await supabase
            .from('profiles')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
              current_period_end: null,
            })
            .eq('stripe_customer_id', customerId);
        } else {
          // Actualizar período
          await supabase
            .from('profiles')
            .update({
              plan: 'pro',
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              stripe_subscription_id: sub.id,
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

        await supabase
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            current_period_end: null,
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // Eventos no manejados
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error procesando webhook';
    console.error('Webhook error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

const PLANS_PRO_PRICE_ID = process.env.STRIPE_PRICE_ID || '';
