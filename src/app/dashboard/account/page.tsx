import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLANS, type PlanId } from '@/lib/plans';
import { AccountClient } from './account-client';

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener perfil completo usando la RPC get_my_full_profile
  const { data: profile, error } = await supabase.rpc('get_my_full_profile');

  if (error || !profile) {
    console.error('[account/page] RPC error:', error);
    // Fallback: query directa
    const { data: fallback } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!fallback) {
      redirect('/login');
    }
  }

  const profileData = (profile as any) || {};
  const plan = PLANS[(profileData.plan as PlanId) || 'free'];

  return (
    <AccountClient
      user={{
        email: user.email || '',
        name: profileData.full_name || user.email?.split('@')[0] || '',
      }}
      plan={plan}
      isSuperAdmin={profileData.is_super_admin === true}
      profile={profileData}
    />
  );
}
