import { createClient } from '@/lib/supabase/server';
import { stripe, getOrCreateCustomer } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Obtener email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.email) {
    return NextResponse.json({ error: 'Perfil incompleto' }, { status: 400 });
  }

  const proPlan = PLANS.pro;
  if (!proPlan.stripePriceId) {
    return NextResponse.json(
      { error: 'STRIPE_PRICE_ID no configurado' },
      { status: 500 }
    );
  }

  // Crear o reusar customer
  const customerId = profile.stripe_customer_id || await getOrCreateCustomer(profile.email, user.id);

  // Guardar customer_id en profile
  if (!profile.stripe_customer_id) {
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: proPlan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/dashboard/billing?success=1`,
    cancel_url: `${origin}/dashboard/billing?canceled=1`,
    metadata: {
      userId: user.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
      },
    },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
