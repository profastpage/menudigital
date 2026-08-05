import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLANS, type PlanId } from '@/lib/plans';
import { AccountClient } from './account-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Intentar primero la RPC (más completa), pero con timeout corto.
  // Si falla (504 o no existe), hacer fallback directo a la tabla profiles.
  let profileData: any = null;

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_full_profile');
    if (!rpcError && rpcData) {
      profileData = rpcData;
    } else if (rpcError) {
      console.warn('[account/page] RPC falló, usando fallback directo:', rpcError.message);
    }
  } catch (err: any) {
    console.warn('[account/page] RPC excepción:', err?.message);
  }

  // Fallback: query directa si la RPC no devolvió nada
  if (!profileData) {
    const { data: direct, error: dirErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (dirErr || !direct) {
      console.error('[account/page] fallback también falló:', dirErr);
      // En lugar de redirect, mostrar datos mínimos para que la página no crashee
      profileData = {
        id: user.id,
        email: user.email,
        full_name: user.email?.split('@')[0] || '',
        plan: 'free',
        is_super_admin: false,
      };
    } else {
      profileData = direct;
    }
  }

  const plan = PLANS[(profileData.plan as PlanId) || 'free'] || PLANS.free;

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
