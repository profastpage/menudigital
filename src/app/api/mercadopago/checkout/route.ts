import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPreapproval } from '@/lib/mercadopago';
import { PLANS } from '@/lib/plans';

/**
 * POST /api/mercadopago/checkout
 *
 * Crea una suscripción (PreApproval) en MercadoPago y devuelve la URL
 * de Checkout Pro (`init_point`) a la que el frontend redirige al usuario.
 *
 * Flujo:
 * 1. Auth check
 * 2. Si ya tiene preapproval_id activo, error (debe cancelar primero)
 * 3. Crear PreApproval con external_reference = userId
 * 4. Guardar mp_preapproval_id en el profile
 * 5. Devolver { url: init_point }
 */
export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, mp_preapproval_id, mp_status')
    .eq('id', user.id)
    .single();

  if (!profile?.email) {
    return NextResponse.json(
      { error: 'Tu perfil no tiene email configurado' },
      { status: 400 }
    );
  }

  // Si ya tiene suscripción activa, no crear otra
  if (
    profile.mp_preapproval_id &&
    profile.mp_status === 'authorized'
  ) {
    return NextResponse.json(
      { error: 'Ya tienes una suscripción Pro activa' },
      { status: 400 }
    );
  }

  const proPlan = PLANS.pro;
  if (!proPlan.mpAmount) {
    return NextResponse.json(
      { error: 'Configuración de plan inválida (sin mpAmount)' },
      { status: 500 }
    );
  }
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const result = await createPreapproval({
      payerEmail: profile.email,
      reason: 'MenuPro Pro — Suscripción mensual',
      amount: proPlan.mpAmount,
      userId: user.id,
      backUrl: `${origin}/dashboard/billing?success=1`,
    });

    // Guardar el preapproval_id para poder asociar el webhook
    await supabase
      .from('profiles')
      .update({
        mp_preapproval_id: result.id,
        mp_status: 'pending',
      })
      .eq('id', user.id);

    return NextResponse.json({ url: result.initPoint });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Error creando suscripción';
    console.error('[MP checkout] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
