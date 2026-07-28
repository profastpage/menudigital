import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingClient } from './onboarding-client';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/onboarding');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, onboarding_completed_at')
    .eq('id', user.id)
    .single();

  // Si ya completó onboarding, redirigir al dashboard
  if (profile?.onboarding_completed_at) {
    redirect('/dashboard');
  }

  return (
    <OnboardingClient
      userEmail={profile?.email || user.email || ''}
      defaultName={profile?.full_name || undefined}
    />
  );
}
