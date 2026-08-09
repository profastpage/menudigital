import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { MozoPanel } from './mozo-client';

/**
 * Ruta pública del panel del MOZO: /mozo/{qr_token}
 *
 * ⚠️  ARQUITECTURA — Acceso externo sin login:
 *
 * El MOZO es un usuario EXTERNO que recibe un enlace (o QR) del dueño del
 * restaurante. NO debe iniciar sesión con la cuenta del dueño. El acceso se
 * valida exclusivamente con el `qr_token` (48 chars hex, unguessable) +
 * opcionalmente una contraseña que el dueño configura desde /dashboard/mozos
 * (planes Premium/Full).
 *
 * Problema anterior:
 *   - `waiters` tiene RLS con policy `waiters_owner_all` que exige
 *     `owner_id = auth.uid()`. Sin sesión, `auth.uid()` es null → query
 *     devuelve 0 filas → notFound() → 404.
 *
 * Solución en 3 capas (defensa en profundidad):
 *
 *   1) Service role client (preferida): bypassa RLS por completo. Solo
 *      disponible si SUPABASE_SERVICE_ROLE_KEY está configurada en Vercel.
 *
 *   2) SECURITY DEFINER function `mozo_public_lookup(p_token)`: devuelve
 *      SOLO columnas seguras (id, full_name, is_active, owner_id, branch_id,
 *      has_password, has_pin). NO devuelve password/pin reales. Funciona
 *      con el anon client. Requiere la migración `supabase/mozo-public-access.sql`.
 *
 *   3) Anon client + RLS policy `waiters_public_lookup_by_token`: permite
 *      SELECT directo por qr_token. Última opción.
 *
 * Seguridad:
 *   - El token es hex 48 chars (entropía 192 bits, inbrutable).
 *   - Si el mozo tiene contraseña, /api/mozo-panel la valida (server-side).
 *   - El dueño puede rotar el token desde /dashboard/mozos en cualquier momento.
 *   - El service role key NUNCA se expone al cliente (es solo server-side).
 */
export default async function MozoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Validación temprana de formato — evita golpear Supabase con tokens inválidos
  if (!token || token.length < 16 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    notFound();
  }

  // ─── Capa 1: Service role client (bypassa RLS) ──────────────
  const serviceClient = createServiceClient();
  if (serviceClient) {
    const { data: waiter } = await serviceClient
      .from('waiters')
      .select('id, full_name, is_active, qr_token')
      .eq('qr_token', token)
      .single();

    // Cast a tipo explícito — el service client no tiene Database typing
    const w = waiter as { id: string; full_name: string; is_active: boolean; qr_token: string } | null;
    if (!w || !w.is_active) notFound();

    return <MozoPanel token={token} waiterName={w.full_name} />;
  }

  // ─── Capa 2: SECURITY DEFINER function (anon client) ────────
  // Si la service role key no está configurada, usamos la función pública
  // `mozo_public_lookup` que devuelve solo columnas seguras.
  const supabase = await createClient();

  const { data: waiterSafe, error: rpcErr } = await supabase
    .rpc('mozo_public_lookup', { p_token: token });

  // waiterSafe puede ser un array (RETURNS TABLE) o un objeto
  const waiterData = (Array.isArray(waiterSafe) ? waiterSafe[0] : waiterSafe) as
    | { id: string; full_name: string; is_active: boolean }
    | null
    | undefined;

  if (rpcErr || !waiterData) {
    // ─── Capa 3: fallback a SELECT directo (RLS policy pública) ──
    // Si la función RPC no existe (migración no aplicada), intentamos
    // SELECT directo. Funciona si la policy `waiters_public_lookup_by_token`
    // está activa.
    const { data: waiterFallback } = await supabase
      .from('waiters')
      .select('id, full_name, is_active, qr_token')
      .eq('qr_token', token)
      .single();

    if (!waiterFallback || !waiterFallback.is_active) notFound();

    return <MozoPanel token={token} waiterName={waiterFallback.full_name} />;
  }

  if (!waiterData.is_active) notFound();

  return <MozoPanel token={token} waiterName={waiterData.full_name} />;
}
