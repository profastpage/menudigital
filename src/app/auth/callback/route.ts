import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirect = requestUrl.searchParams.get('redirect');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Si hay error de OAuth (ej: usuario canceló, o Google retornó error)
  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('error', error);
    if (errorDescription) loginUrl.searchParams.set('error_description', errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginUrl = new URL('/login', requestUrl.origin);
      loginUrl.searchParams.set('error', 'auth_failed');
      loginUrl.searchParams.set('error_description', exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    // ── Detectar rol del usuario y redirigir automáticamente ──
    // Si el usuario es super_admin → /superadmin
    // Si el usuario está baneado → logout + error
    // Si no hay redirect explícito → /dashboard
    if (!redirect) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_super_admin, is_active')
          .eq('id', user.id)
          .single();

        // Usuario baneado → cerrar sesión inmediatamente
        if (profile && profile.is_active === false) {
          await supabase.auth.signOut();
          const loginUrl = new URL('/login', requestUrl.origin);
          loginUrl.searchParams.set('error', 'account_banned');
          loginUrl.searchParams.set(
            'error_description',
            'Tu cuenta ha sido desactivada. Contacta al administrador.'
          );
          return NextResponse.redirect(loginUrl);
        }

        // Super admin → panel /superadmin
        if (profile?.is_super_admin) {
          const superadminUrl = new URL('/superadmin', requestUrl.origin);
          return NextResponse.redirect(superadminUrl);
        }
      }
    }
  }

  // Redirigir al destino (default /dashboard)
  const target = redirect || '/dashboard';
  const targetUrl = new URL(target, requestUrl.origin);
  return NextResponse.redirect(targetUrl);
}
