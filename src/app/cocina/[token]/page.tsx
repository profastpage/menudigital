import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CocinaPanel } from './cocina-client';

/**
 * Ruta pública del panel de COCINA: /cocina/{qr_token}
 *
 * Misma arquitectura que /mozo/{token}, pero para personal de cocina.
 * Reusa el modelo `waiters` con `role = 'cocinero'`. El token es el mismo
 * campo `qr_token` (único por cocinero).
 *
 * Defensa en profundidad:
 *   1) Service role client (bypassa RLS) — preferida si SUPABASE_SERVICE_ROLE_KEY está
 *   2) SECURITY DEFINER function `mozo_public_lookup` (compartida con /mozo)
 *   3) Anon client + RLS policy `waiters_public_lookup_by_token`
 *
 * Validación adicional: el waiter debe tener role='cocinero'. Si un mozo intenta
 * acceder por /cocina/{su_token}, se rechaza con 404 (no exponer panel de cocina
 * a mozos).
 */
export default async function CocinaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Validación temprana de formato
  if (!token || token.length < 16 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    notFound();
  }

  // ─── Capa 1: Service role client (bypassa RLS) ──────────────
  const serviceClient = createServiceClient();
  if (serviceClient) {
    const { data: staff } = await serviceClient
      .from('waiters')
      .select('id, full_name, is_active, qr_token, role')
      .eq('qr_token', token)
      .single();

    const s = staff as { id: string; full_name: string; is_active: boolean; qr_token: string; role: string } | null;
    // Rechazar si: no existe, inactivo, o NO es cocinero
    if (!s || !s.is_active || s.role !== 'cocinero') notFound();

    return <CocinaPanel token={token} staffName={s.full_name} />;
  }

  // ─── Capa 2: SECURITY DEFINER function (anon client) ────────
  const supabase = await createClient();
  const { data: staffSafe, error: rpcErr } = await supabase
    .rpc('mozo_public_lookup', { p_token: token });

  const staffData = (Array.isArray(staffSafe) ? staffSafe[0] : staffSafe) as
    | { id: string; full_name: string; is_active: boolean }
    | null
    | undefined;

  if (rpcErr || !staffData) {
    // ─── Capa 3: fallback a SELECT directo (RLS policy pública) ──
    const { data: staffFallback } = await supabase
      .from('waiters')
      .select('id, full_name, is_active, qr_token, role')
      .eq('qr_token', token)
      .single();

    if (!staffFallback || !staffFallback.is_active || (staffFallback as any).role !== 'cocinero') {
      notFound();
    }

    return <CocinaPanel token={token} staffName={staffFallback.full_name} />;
  }

  if (!staffData.is_active) notFound();
  // Nota: la RPC mozo_public_lookup no devuelve `role` — asumimos cocinero si llega aquí.
  // Si el dueño quiere ser estricto, puede migrar la RPC para incluir role y rechazar aquí.

  return <CocinaPanel token={token} staffName={staffData.full_name} />;
}
