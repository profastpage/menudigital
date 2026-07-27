import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLANS } from '@/lib/plans';
import { DashboardClient } from '../dashboard-client';

export const dynamic = 'force-dynamic';

export default async function MenusPage() {
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

  const plan = PLANS[profile?.plan || 'free'];

  const { data: menus } = await supabase
    .from('menus')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <DashboardClient
      user={{ email: user.email || '', name: profile?.full_name || user.email?.split('@')[0] || '' }}
      plan={plan}
      menus={menus || []}
      isSuperAdmin={profile?.is_super_admin === true}
    />
  );
}
