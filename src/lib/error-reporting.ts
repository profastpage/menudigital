/**
 * Wrapper de reporting de errores.
 *
 * Si NEXT_PUBLIC_SENTRY_DSN está configurado, los errores se envían a Sentry.
 * Si no, se loguean a consola (server-side) o se ignoran silenciosamente
 * (client-side) para no romper el UX.
 *
 * Esto permite tener la infraestructura lista y solo activarla cuando
 * el usuario configure su cuenta de Sentry.
 */

let sentryClient: any = null;
let sentryChecked = false;

async function getSentryClient() {
  if (sentryChecked) return sentryClient;
  sentryChecked = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return null;

  try {
    const Sentry = await import('@sentry/nextjs');
    // El init() lo hace sentry.client.config.ts y sentry.server.config.ts
    // Aquí solo exponemos la API.
    sentryClient = Sentry;
  } catch (err) {
    console.warn('[sentry] No se pudo cargar @sentry/nextjs:', err);
  }
  return sentryClient;
}

export interface ReportErrorOptions {
  /** Mensaje del error */
  message?: string;
  /** Tags adicionales */
  tags?: Record<string, string>;
  /** Contexto adicional */
  extra?: Record<string, any>;
  /** Usuario afectado (id, email) */
  user?: { id: string; email?: string };
  /** Nivel de severidad */
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Reporta un error a Sentry (si está configurado) o lo loguea.
 * Safe de llamar desde server o client components.
 */
export async function reportError(
  error: Error | unknown,
  options: ReportErrorOptions = {}
): Promise<void> {
  const err = error instanceof Error ? error : new Error(String(error));

  const Sentry = await getSentryClient();
  if (!Sentry) {
    // Fallback a consola
    if (typeof window === 'undefined') {
      console.error('[reportError]', err, options);
    }
    return;
  }

  try {
    if (options.user) {
      Sentry.setUser(options.user);
    }
    if (options.tags) {
      Sentry.setTags(options.tags);
    }
    if (options.extra) {
      Sentry.setExtras(options.extra);
    }
    if (options.level) {
      Sentry.captureException(err, { level: options.level });
    } else {
      Sentry.captureException(err);
    }
  } catch (reportErr) {
    console.error('[reportError] Falló reporte a Sentry:', reportErr);
    console.error('[reportError] Error original:', err);
  }
}

/**
 * Reporta un mensaje (sin excepción) a Sentry.
 */
export async function reportMessage(
  message: string,
  options: Omit<ReportErrorOptions, 'message'> = {}
): Promise<void> {
  const Sentry = await getSentryClient();
  if (!Sentry) {
    console.log('[reportMessage]', message, options);
    return;
  }

  try {
    if (options.user) Sentry.setUser(options.user);
    if (options.tags) Sentry.setTags(options.tags);
    if (options.extra) Sentry.setExtras(options.extra);
    Sentry.captureMessage(message, options.level || 'info');
  } catch (err) {
    console.error('[reportMessage] Falló reporte:', err);
  }
}

/**
 * Para obtener el trace de Sentry en server-side (para logs).
 */
export async function getTraceId(): Promise<string | null> {
  const Sentry = await getSentryClient();
  if (!Sentry) return null;
  try {
    return Sentry.getCurrentHub()?.getScope()?.getLastEventId?.() || null;
  } catch {
    return null;
  }
}
