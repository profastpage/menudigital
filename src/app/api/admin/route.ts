import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin — Dashboard de super admin
 * Devuelve estadísticas globales + lista de usuarios con sus menús
 * Solo accesible para super_admins
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const url = new URL(req.url);
  const tab = url.searchParams.get('tab') || 'users';
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = 20;

  if (tab === 'stats') {
    return getStats(supabase);
  }

  if (tab === 'domains') {
    return getDomains(supabase);
  }

  // Default: users list
  return getUsers(supabase, search, page, pageSize);
}

/**
 * PUT /api/admin — Acciones de admin sobre usuarios
 * Body: { action: 'toggle_plan' | 'toggle_super_admin' | 'delete_user', userId: string }
 */
export async function PUT(req: NextRequest) {
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
  const { action, userId } = body;

  if (!userId || !action) {
    return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
  }

  // No permitir admin autodestituirse
  if (userId === user.id && action === 'toggle_super_admin') {
    return NextResponse.json(
      { error: 'No puedes quitarte el rol de super admin a ti mismo' },
      { status: 400 }
    );
  }

  switch (action) {
    case 'toggle_plan': {
      // Obtener plan actual
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();
      const newPlan = targetProfile?.plan === 'pro' ? 'free' : 'pro';
      const { error } = await supabase
        .from('profiles')
        .update({
          plan: newPlan,
          current_period_end: newPlan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, newPlan });
    }

    case 'toggle_super_admin': {
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', userId)
        .single();
      const newVal = !targetProfile?.is_super_admin;
      const { error } = await supabase
        .from('profiles')
        .update({ is_super_admin: newVal })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, is_super_admin: newVal });
    }

    case 'delete_user': {
      // Borrar menús del usuario (cascade borra categorías y platos)
      const { error: menuErr } = await supabase
        .from('menus')
        .delete()
        .eq('user_id', userId);
      if (menuErr) return NextResponse.json({ error: menuErr.message }, { status: 500 });

      // Borrar profile
      const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });

      // Nota: auth.users se maneja desde Supabase Dashboard → Authentication
      return NextResponse.json({ success: true });
    }

    case 'delete_menu': {
      const { menuId } = body;
      if (!menuId) return NextResponse.json({ error: 'Falta menuId' }, { status: 400 });
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', menuId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  }
}

// ── Helpers ────────────────────────────────────────────────

async function getStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: proUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('plan', 'pro');

  const { count: totalMenus } = await supabase
    .from('menus')
    .select('*', { count: 'exact', head: true });

  const { count: publishedMenus } = await supabase
    .from('menus')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  const { count: totalCategories } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true });

  const { count: totalDishes } = await supabase
    .from('dishes')
    .select('*', { count: 'exact', head: true });

  const { count: totalDomains } = await supabase
    .from('custom_domains')
    .select('*', { count: 'exact', head: true });

  const { count: verifiedDomains } = await supabase
    .from('custom_domains')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  // Total views
  const { data: viewsData } = await supabase
    .from('menus')
    .select('views_count');
  const totalViews = (viewsData || []).reduce((sum, m) => sum + (m.views_count || 0), 0);

  // Recent signups (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: recentSignups } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  return NextResponse.json({
    stats: {
      totalUsers: totalUsers || 0,
      proUsers: proUsers || 0,
      freeUsers: (totalUsers || 0) - (proUsers || 0),
      totalMenus: totalMenus || 0,
      publishedMenus: publishedMenus || 0,
      totalCategories: totalCategories || 0,
      totalDishes: totalDishes || 0,
      totalDomains: totalDomains || 0,
      verifiedDomains: verifiedDomains || 0,
      totalViews,
      recentSignups: recentSignups || 0,
    },
  });
}

async function getDomains(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase
    .from('custom_domains')
    .select(`
      *,
      profiles:user_id (email, full_name, plan),
      menus:menu_id (name, slug)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domains: data || [] });
}

async function getUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  search: string,
  page: number,
  pageSize: number
) {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Para cada usuario obtener conteo de menús
  const usersWithMenus = await Promise.all(
    (data || []).map(async (u) => {
      const { count: menuCount } = await supabase
        .from('menus')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', u.id);
      const { count: dishCount } = await supabase
        .from('menus')
        .select('id, categories:categories(count)')
        .eq('user_id', u.id)
        .single();
      return {
        ...u,
        menus_count: menuCount || 0,
      };
    })
  );

  return NextResponse.json({
    users: usersWithMenus,
    total: count || 0,
    page,
    pageSize,
  });
}
