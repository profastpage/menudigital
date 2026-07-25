import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GeneradorClient } from './generador-client';

export default async function GeneradorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/generador');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, plan, is_super_admin')
    .eq('id', user.id)
    .single();

  return (
    <GeneradorClient
      user={{
        email: user.email || '',
        name: profile?.full_name || user.email?.split('@')[0] || '',
      }}
      isSuperAdmin={profile?.is_super_admin === true}
      profilePlan={profile?.plan || 'free'}
    />
  );
}
