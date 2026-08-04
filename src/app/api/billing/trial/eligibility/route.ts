import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/billing/trial/eligibility
 *
 * Devuelve si el usuario puede ver la promo de trial:
 *   - Plan free o pro → puede ver
 *   - Plan premium/full → no (ya está en plan superior)
 *   - Ya usó ese trial → no (no se puede repetir)
 *   - Trial activo ahora → no
 *   - Cerró promo hace <7 días → no
 *
 * Respuesta:
 *   {
 *     show_premium_trial: boolean,
 *     show_full_trial: boolean,
 *     premium_days: 5,
 *     full_days: 10,
 *     current_plan: 'free' | 'pro' | 'premium' | 'full',
 *     dismissed_age_days: number,
 *     reason?: string
 *   }
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data, error } = await supabase.rpc('check_trial_eligibility');

  if (error) {
    console.error('[trial/eligibility] RPC error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
