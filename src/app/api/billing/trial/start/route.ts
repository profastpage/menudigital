import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/billing/trial/start
 *
 * Body: { plan: 'premium' | 'full', withCard?: boolean }
 *
 * Inicia un trial:
 *   - Premium: 5 días gratis SIN tarjeta
 *   - Full: 10 días gratis SIN tarjeta
 *
 * Si withCard=true, después del trial se cobra automáticamente.
 * (Requiere setup adicional con MercadoPago Customer + Card Token — por ahora
 *  implementamos la versión sin tarjeta; el cobro post-trial se hace con
 *  un recordatorio por email + CTA en el dashboard.)
 *
 * Validaciones:
 *   - Usuario en plan free o pro
 *   - No haya usado ya ese trial
 *   - No tenga trial activo ahora
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const plan = body?.plan;
  const withCard = Boolean(body?.withCard);

  if (!['premium', 'full'].includes(plan)) {
    return NextResponse.json(
      { error: 'Plan inválido. Debe ser "premium" o "full".' },
      { status: 400 }
    );
  }

  const days = plan === 'premium' ? 5 : 10;

  // Llamar a la RPC que valida y aplica el trial
  const { data, error } = await supabase.rpc('start_user_trial', {
    p_plan: plan,
    p_days: days,
    p_with_card: withCard,
  });

  if (error) {
    console.error('[trial/start] RPC error:', error.message);
    return NextResponse.json(
      { error: error.message || 'No se pudo iniciar el trial' },
      { status: 400 }
    );
  }

  console.log(`[trial/start] ✅ Usuario ${user.id} inició trial ${plan} por ${days} días`);

  return NextResponse.json({
    success: true,
    plan,
    trial_ends_at: data.trial_ends_at,
    days,
    message: `¡Trial ${plan.toUpperCase()} activado por ${days} días!`,
  });
}
