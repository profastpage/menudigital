/**
 * Instrumentation hook — Sentry.
 *
 * Si Sentry está configurado, registra el hook de server-side.
 * Si no, es un no-op.
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual/
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.server.config');
  }
}
