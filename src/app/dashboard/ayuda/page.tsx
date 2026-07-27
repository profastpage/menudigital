import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AyudaClient } from './ayuda-client';

export const dynamic = 'force-dynamic';

export default async function AyudaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/ayuda');
  }

  return <AyudaClient />;
}
