import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Middleware global:
 * 1. Rate limiting para endpoints sensibles (auth, upload, webhooks)
 * 2. Refresco de sesión Supabase (cookie-based)
 * 3. Protección de rutas /dashboard y /superadmin
 * 4. Redirección post-login según rol
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ─── Rate limiting para endpoints sensibles ───
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Auth: /api/auth/* + /auth/callback
  if (path === '/api/auth/logout' || path.startsWith('/api/auth/')) {
    const limited = checkRateLimit(`auth:${ip}`, RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowSec);
    if (!limited.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Demasiados intentos. Intenta en ${limited.retryAfter}s.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(limited.retryAfter),
          },
        }
      );
    }
  }

  // Upload de imágenes (procesa sharp, consume CPU + storage)
  if (path === '/api/upload' || path.startsWith('/api/upload/')) {
    const limited = checkRateLimit(`upload:${ip}`, RATE_LIMITS.upload.limit, RATE_LIMITS.upload.windowSec);
    if (!limited.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Estás subiendo imágenes muy rápido. Intenta en ${limited.retryAfter}s.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(limited.retryAfter),
          },
        }
      );
    }
  }

  // Background removal (compute-heavy, IA)
  if (path.startsWith('/api/bg-removal/')) {
    const limited = checkRateLimit(`bg-removal:${ip}`, RATE_LIMITS.bgRemoval.limit, RATE_LIMITS.bgRemoval.windowSec);
    if (!limited.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Demasiadas solicitudes de quitar fondo. Intenta en ${limited.retryAfter}s.`,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(limited.retryAfter),
          },
        }
      );
    }
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map)$).*)',
  ],
};
