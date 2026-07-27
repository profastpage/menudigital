/**
 * Configuración client-side de Sentry.
 *
 * Se activa automáticamente si NEXT_PUBLIC_SENTRY_DSN está configurado.
 * Si no lo está, este archivo es un no-op.
 *
 * Para activar:
 * 1. Crea cuenta en https://sentry.io (tier free es suficiente)
 * 2. Crea un proyecto "Next.js"
 * 3. Copia el DSN en Vercel → Settings → Environment Variables
 *    como NEXT_PUBLIC_SENTRY_DSN
 * 4. (Opcional) SENTRY_AUTH_TOKEN para source maps (mejor stack traces)
 * 5. Redeploy
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Performance monitoring (tracing)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session replay (captura la última sesión antes del error)
    // Solo se activa si el usuario opta por ello. Por defecto desactivado por privacidad.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Ignorar rutas de desarrollo local
    ignoreErrors: [
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
      // Errores comunes de extensiones de navegador
      'top.GLOBALS',
      'canvas.contentDocument',
    ],

    // Ignorar URLs no relevantes
    denyUrls: [
      // Extensiones
      /extensions\//i,
      /^chrome:\/\//i,
      // Otros
      /googletagmanager\.com/i,
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Enmascarar inputs sensibles (contraseñas, tarjetas, etc.)
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production',
  });
}
