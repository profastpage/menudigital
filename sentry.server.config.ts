/**
 * Configuración server-side de Sentry.
 *
 * Se activa automáticamente si SENTRY_DSN está configurado.
 * El DSN puede ser el mismo que el client-side (NEXT_PUBLIC_SENTRY_DSN)
 * o uno distinto si quieres separar eventos server/client.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Tracing más agresivo en server (no afecta UX)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,

    // Profiles para CPU profiling
    profilesSampleRate: 0.1,

    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',

    // Ignorar errores comunes no accionables
    ignoreErrors: [
      'EDeadlock',
      'ECONNRESET',
      'ETIMEDOUT',
      // Supabase ocasionalmente lanza estos
      'fetch failed',
    ],
  });
}
