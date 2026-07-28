/**
 * Rate limiter en memoria para endpoints sensibles.
 *
 * Limitaciones:
 * - En Vercel serverless, cada instancia tiene su propio contador.
 *   El límite efectivo puede ser (limit × número de instancias activas),
 *   pero el efecto protector sigue siendo efectivo para prevenir abuso
 *   individual.
 *
 * - Para rate limiting distribuido real, considerar Upstash Ratelimit
 *   (Redis serverless) si se identifica abuso a nivel de red.
 *
 * Para nuestros fines:
 * - Auth: 10 intentos por minuto por IP (prevenir brute force)
 * - Webhook MP: 60 por minuto (MP reintenta con backoff)
 * - Upload: 30 por minuto por usuario (limitar subidas masivas)
 * - API generales: 100 por minuto por IP
 */

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// Cleanup periódico (cada 5 min) — se ejecuta on-demand al acceder
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number; // segundos hasta reset
}

/**
 * Verifica si una acción está permitida bajo el rate limit.
 *
 * @param key Clave única (por IP, usuario, o combinación)
 * @param limit Número máximo de acciones
 * @param windowSec Ventana de tiempo en segundos
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = windowSec * 1000;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    // Crear nuevo bucket
    const bucket: RateBucket = {
      count: 1,
      resetAt: now + windowMs,
    };
    buckets.set(key, bucket);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: bucket.resetAt,
      retryAfter: windowSec,
    };
  }

  // Incrementar contador
  existing.count++;

  const remaining = Math.max(0, limit - existing.count);
  const success = existing.count <= limit;
  const retryAfter = Math.ceil((existing.resetAt - now) / 1000);

  return {
    success,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfter: Math.max(1, retryAfter),
  };
}

/**
 * Obtiene la IP real del cliente.
 * En Vercel, respeta el header x-forwarded-for.
 */
export function getClientIP(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // El primer IP es el del cliente original
    return xff.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

// ───────────────────────────────────────────────
// Presets por tipo de endpoint
// ───────────────────────────────────────────────

export const RATE_LIMITS = {
  // Auth: protege contra brute force y enum de cuentas
  auth: { limit: 10, windowSec: 60 }, // 10 intentos / minuto
  // Webhook MP: MercadoPago reintenta con backoff exponencial
  webhookMP: { limit: 60, windowSec: 60 }, // 60 / minuto
  // Upload de imágenes: limita subidas masivas
  upload: { limit: 30, windowSec: 60 }, // 30 / minuto por usuario
  // APIs generales
  api: { limit: 100, windowSec: 60 }, // 100 / minuto
  // Generación de QR (compute-intensive)
  qr: { limit: 20, windowSec: 60 }, // 20 / minuto
  // Background removal (compute-heavy, costs money)
  bgRemoval: { limit: 5, windowSec: 60 }, // 5 / minuto
} as const;

/**
 * Helper para verificar rate limit y devolver una respuesta 429
 * si se excede. Listo para usar en route handlers.
 *
 * Ejemplo:
 *   const ip = getClientIP(req);
 *   const limited = rateLimitResponse(`auth:${ip}`, RATE_LIMITS.auth);
 *   if (limited) return limited;
 */
export function rateLimitResponse(
  key: string,
  config: { limit: number; windowSec: number }
): Response | null {
  const result = checkRateLimit(key, config.limit, config.windowSec);
  if (result.success) return null;

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Demasiadas solicitudes. Intenta de nuevo en ${result.retryAfter} segundos.`,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
