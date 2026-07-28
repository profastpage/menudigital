import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service client para operaciones server-side que BYPASS RLS.
 *
 * USAR CON PRECAUCIÓN: solo en webhooks, jobs cron, o scripts server-side
 * donde no hay sesión de usuario. NUNCA exponer al cliente.
 *
 * Requiere la env var SUPABASE_SERVICE_ROLE_KEY (disponible en:
 * Supabase Dashboard → Settings → API → service_role secret).
 *
 * Si no está configurada, retorna null — el llamador debe manejar el caso
 * (fallback a cliente normal o log de warning).
 */
let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function createServiceClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  _client = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
