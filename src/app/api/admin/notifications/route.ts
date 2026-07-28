import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/notifications
 *   ?unread_only=1   → solo no leídas
 *   ?limit=20        → máx a retornar (default 50, max 200)
 *
 * Retorna las notificaciones para el super admin autenticado.
 * Soporta polling desde el panel (cada 30-60s).
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const url = new URL(req.url);
  const unreadOnly = url.searchParams.get('unread_only') === '1';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

  let query = (supabase
    .from('admin_notifications') as any)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Contar no leídas (para badge)
  const { count: unreadCount, error: countErr } = await (supabase
    .from('admin_notifications') as any)
    .select('*', { count: 'exact', head: true })
    .is('read_at', null);

  if (countErr) {
    console.warn('[admin/notifications] count error:', countErr.message);
  }

  return NextResponse.json({
    notifications: data || [],
    unread_count: unreadCount || 0,
  });
}

/**
 * POST /api/admin/notifications
 * Marca una o varias notificaciones como leídas.
 * Body: { id?: string, all?: boolean }
 *   - { id: "uuid" }     → marca esa como leída
 *   - { all: true }      → marca todas como leídas
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const body = await req.json();
  const now = new Date().toISOString();

  if (body.all === true) {
    const { error } = await (supabase
      .from('admin_notifications') as any)
      .update({ read_at: now })
      .is('read_at', null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, marked: 'all' });
  }

  if (body.id) {
    const { error } = await (supabase
      .from('admin_notifications') as any)
      .update({ read_at: now })
      .eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, marked: body.id });
  }

  return NextResponse.json({ error: 'Se requiere id o all=true' }, { status: 400 });
}
