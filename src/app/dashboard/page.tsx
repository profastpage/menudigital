import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLANS } from '@/lib/plans';
import { DashboardHomeClient } from './dashboard-home-client';

export const dynamic = 'force-dynamic';

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.is_super_admin === true && profile?.is_active !== false) {
    redirect('/superadmin');
  }

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    redirect('/login?error=account_banned');
  }

  // Si el usuario no completó el onboarding Y no tiene menús, redirigir al wizard
  // (super_admin ya fue redirigido arriba, así que aquí solo llega cliente normal)
  const { count: menusCount } = await supabase
    .from('menus')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (!profile?.onboarding_completed_at && (menusCount || 0) === 0) {
    redirect('/dashboard/onboarding');
  }

  const plan = PLANS[profile?.plan || 'free'];

  // Cargar menus y views para el dashboard
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, slug, views_count, created_at, is_published')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Total views global
  const totalViews = (menus || []).reduce((sum, m) => sum + (m.views_count || 0), 0);

  // Para Premium+: cargar comandas recientes
  let recentComandas: any[] = [];
  if (plan.id === 'premium' || plan.id === 'full') {
    const { data: cmd } = await supabase
      .from('comandas')
      .select('id, status, total, created_at, mesa_numero, items_count')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8);
    recentComandas = cmd || [];
  }

  // Para Full: cargar ingresos del mes + reportes
  let monthRevenue = 0;
  let monthComandasCount = 0;
  let topDishes: any[] = [];
  if (plan.id === 'full') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { data: monthCmd } = await supabase
      .from('comandas')
      .select('total, created_at')
      .eq('owner_id', user.id)
      .gte('created_at', startOfMonth.toISOString());
    monthRevenue = (monthCmd || []).reduce((s, c) => s + (c.total || 0), 0);
    monthComandasCount = (monthCmd || []).length;

    const { data: topD } = await supabase
      .from('comanda_items')
      .select('name, qty, price')
      .eq('owner_id', user.id)
      .order('qty', { ascending: false })
      .limit(5);
    topDishes = (topD || []).map(d => ({
      name: d.name,
      qty: d.qty,
      revenue: (d.price || 0) * d.qty,
    }));
  }

  return (
    <DashboardHomeClient
      user={{ email: user.email || '', name: profile?.full_name || user.email?.split('@')[0] || '' }}
      plan={plan}
      isSuperAdmin={profile?.is_super_admin === true}
      stats={{
        menusCount: (menus || []).length,
        publishedCount: (menus || []).filter(m => m.is_published && m.slug).length,
        totalViews,
        recentComandas,
        monthRevenue,
        monthComandasCount,
        topDishes,
        menus: (menus || []).map(m => ({
          id: m.id,
          name: m.name,
          slug: m.slug,
          views: m.views_count || 0,
          isPublished: !!m.is_published && !!m.slug,
        })),
      }}
    />
  );
}
