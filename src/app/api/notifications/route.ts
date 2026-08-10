import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications
 *   ?waiter_id=xxx  → notificaciones para un mozo específico
 *   ?unread=1       → solo no leídas
 *   ?limit=50
 *
 * Response: { notifications: [...] }
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const url = new URL(req.url);
  const waiterId = url.searchParams.get('waiter_id');
  const unread = url.searchParams.get('unread') === '1';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  let query = supabase
    .from('notifications')
    .select('id, type, title, body, sound, vibrate, is_read, created_at, order_id, waiter_id')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (waiterId) query = query.eq('waiter_id', waiterId);
  if (unread) query = query.eq('is_read', false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data || [] });
}

/**
 * POST /api/notifications/mark-read
 * Body: { ids: [uuid, ...] } o { all: true, waiter_id?: uuid }
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const body = await req.json();
  const { ids, all, waiter_id } = body || {};

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('owner_id', user.id);

  if (all) {
    if (waiter_id) query = query.eq('waiter_id', waiter_id);
  } else if (Array.isArray(ids) && ids.length > 0) {
    query = query.in('id', ids);
  } else {
    return NextResponse.json({ error: 'ids[] o all:true requerido' }, { status: 400 });
  }

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
