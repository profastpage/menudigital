import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PLANS } from '@/lib/plans';
import { AnalyticsClient } from './analytics-client';

export default async function AnalyticsPage() {
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

  const plan = PLANS[profile?.plan || 'free'];

  const { data: menus } = await supabase
    .from('menus')
    .select('id, name, slug, views_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <AnalyticsClient
      plan={plan}
      menus={menus || []}
      profile={{ plan: profile?.plan || 'free' }}
    />
  );
}
