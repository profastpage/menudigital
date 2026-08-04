import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/expire-trials
 *
 * Cron job que expira trials vencidos.
 * En Vercel Hobby: se ejecuta 1 vez al día (6 AM UTC = 1 AM hora Perú).
 * Para más frecuencia, upgrade a Vercel Pro.
 *
 * Header requerido: x-cron-secret (configurar CRON_SECRET en Vercel)
 *
 * Lógica:
 *   - Busca usuarios con trial_ends_at < NOW() y plan in ('premium','full')
 *   - Los vuelve a plan='free'
 *   - mp_status se queda como está (por si MP ya cobró y llegó webhook)
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[cron/expire-trials] CRON_SECRET no configurado');
    return NextResponse.json(
      { error: 'CRON_SECRET no configurado en env' },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('expire_user_trials');

  if (error) {
    console.error('[cron/expire-trials] RPC error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const expiredCount = (data as number) || 0;
  if (expiredCount > 0) {
    console.log(`[cron/expire-trials] ✅ ${expiredCount} trial(s) expirados`);
  }

  return NextResponse.json({
    success: true,
    expired_trials: expiredCount,
    timestamp: new Date().toISOString(),
  });
}
