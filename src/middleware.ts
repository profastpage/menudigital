import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Middleware global:
 * 1. Rate limiting por tiers para TODOS los endpoints /api/*
 *    - Tier especial: auth, upload, bg-removal, track, webhook MP (más estricto)
 *    - Tier general: 200 req/min por IP para cualquier otra API
 * 2. Refresco de sesión Supabase (cookie-based)
 * 3. Protección de rutas /dashboard y /superadmin
 * 4. Redirección post-login según rol
 *
 * Esto protege Supabase (pool de conexiones), Vercel (cold starts)
 * y el sistema en general de abuso individual o bots malintencionados.
 */

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // ─── IP del cliente (Vercel: x-forwarded-for) ───
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // ─── Rate limiting para endpoints sensibles ───

  // Auth: /api/auth/* + /auth/callback (brute force protection)
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

  // Tracking público (beacons de menú público) — alto volumen pero legit
  // 60/min por IP (suficiente para navegación real, bloquea spam masivo)
  if (path.startsWith('/api/track/')) {
    const limited = checkRateLimit(`track:${ip}`, 60, 60);
    if (!limited.success) {
      return new NextResponse(null, { status: 429 });
    }
  }

  // Webhook MercadoPago (MP reintenta con backoff exponencial)
  if (path === '/api/mercadopago/webhook') {
    const limited = checkRateLimit(`mp-webhook:${ip}`, RATE_LIMITS.webhookMP.limit, RATE_LIMITS.webhookMP.windowSec);
    if (!limited.success) {
      return new NextResponse(
        JSON.stringify({ error: 'Too Many Requests' }),
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

  // ─── Rate limiting GENERAL para cualquier otra ruta /api/* ───
  // Protege Supabase pool: 200 req/min por IP para APIs autenticadas
  // (un usuario normal hace < 50 req/min incluso en uso intenso)
  if (path.startsWith('/api/') && method !== 'OPTIONS') {
    // Excluimos /api/track/ (ya tiene su propio bucket arriba)
    // y /api/auth/ (ya tiene su bucket)
    if (!path.startsWith('/api/track/') && !path.startsWith('/api/auth/')) {
      const limited = checkRateLimit(`api:${ip}`, RATE_LIMITS.api.limit, RATE_LIMITS.api.windowSec);
      if (!limited.success) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too Many Requests',
            message: `Estás haciendo muchas solicitudes. Intenta en ${limited.retryAfter}s.`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(limited.retryAfter),
              'X-RateLimit-Limit': String(RATE_LIMITS.api.limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
    }
  }

  // ─── Rate limiting para vista de menú público /r/[slug] ───
  // Previene scraping masivo o DDoS al generar views fantasma
  // 60 vistas/min por IP (más que suficiente para navegación real)
  if (path.startsWith('/r/') || path.startsWith('/qr/')) {
    const limited = checkRateLimit(`menu-view:${ip}`, 60, 60);
    if (!limited.success) {
      // Para páginas públicas devolvemos HTML con mensaje (mejor UX que JSON)
      return new NextResponse(
        `<!doctype html><meta charset=utf-8><title>Demasiadas solicitudes</title>
         <body style="font-family:system-ui;background:#07070b;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:2rem">
         <div><div style="font-size:48px;margin-bottom:1rem">⏳</div>
         <h1>Estás viendo esta página muy rápido</h1>
         <p style="color:#aaa">Espera ${limited.retryAfter} segundos y refresca.</p>
         </div></body>`,
        {
          status: 429,
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': String(limited.retryAfter) },
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
