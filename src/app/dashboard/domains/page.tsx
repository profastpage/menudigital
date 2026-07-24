import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DomainsClient } from './domains-client';

export default async function DomainsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, slug, is_published')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <DomainsClient plan={profile?.plan || 'free'} menus={menus || []} />;
}
