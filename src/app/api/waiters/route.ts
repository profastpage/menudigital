import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLANS, type PlanId } from '@/lib/plans';
import { randomBytes } from 'crypto';

/**
 * GET /api/waiters?role=mozo|cocinero
 *
 * Lista los waiters del dueño autenticado, opcionalmente filtrados por rol.
 *   - role=mozo (default) → meseros que atienden mesas
 *   - role=cocinero       → personal de cocina con perfil + QR externo
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = PLANS[(profile?.plan as PlanId) || 'free'] || PLANS.free;
  if (!plan.limits.hasWaiters) {
    return NextResponse.json({ error: 'Requiere Premium', upgradeRequired: true }, { status: 403 });
  }

  // Filtro por rol — default 'mozo' para backwards compatibility
  const url = new URL(req.url);
  const roleParam = url.searchParams.get('role');
  const role = roleParam === 'cocinero' ? 'cocinero' : 'mozo';

  let query = supabase
    .from('waiters')
    .select('id, full_name, document_id, phone, pin, is_active, qr_token, password, role, created_at')
    .eq('owner_id', user.id)
    .eq('role', role)
    .order('full_name', { ascending: true });

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ waiters: data || [] });
}

/**
 * POST /api/waiters
 * Crea un waiter (mozo o cocinero).
 * Body: { full_name, document_id?, phone?, pin?, password?, role? }
 *   - role default = 'mozo'
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const plan = PLANS[(profile?.plan as PlanId) || 'free'] || PLANS.free;
  if (!plan.limits.hasWaiters) {
    return NextResponse.json({ error: 'Requiere Premium', upgradeRequired: true }, { status: 403 });
  }

  // Verificar límite total (mozos + cocineros cuentan juntos contra `maxWaiters`)
  if (plan.limits.maxWaiters !== -1) {
    const { count } = await supabase
      .from('waiters')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);
    if ((count || 0) >= plan.limits.maxWaiters) {
      return NextResponse.json(
        { error: `Has alcanzado el límite de ${plan.limits.maxWaiters} personal del plan ${plan.name}.` },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const { full_name, document_id, phone, pin, password, role } = body;

  if (!full_name || typeof full_name !== 'string') {
    return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });
  }

  // Validar rol
  const finalRole = role === 'cocinero' ? 'cocinero' : 'mozo';

  const { data, error } = await supabase
    .from('waiters')
    .insert({
      owner_id: user.id,
      full_name,
      document_id: document_id || null,
      phone: phone || null,
      pin: pin || null,
      password: password || null,
      role: finalRole,
      qr_token: randomBytes(24).toString('hex'), // QR token auto-generado para acceso móvil sin login
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ waiter: data });
}
