import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

/**
 * POST /api/track/whatsapp-click
 *
 * Tracking REAL de clics en el botón WhatsApp del menú público.
 * Llamado vía navigator.sendBeacon desde /r/[slug] antes de abrir wa.me.
 *
 * Body:
 *   { menu_id: string, source?: 'cart' | 'social' | 'direct' }
 *
 * Público (sin auth) — el cliente público no tiene sesión.
 * Rate limited: 30/min por IP (suficiente para uso legítimo, bloquea spam).
 *
 * Devuelve 204 No Content (beacon no necesita respuesta).
 */
export async function POST(req: NextRequest) {
  // ─── Rate limiting ───
  const ip = getClientIP(req);
  const limited = checkRateLimit(`wa-track:${ip}`, 30, 60);
  if (!limited.success) {
    return new NextResponse(null, { status: 429 });
  }

  // ─── Parse body (sendBeacon envía Blob con JSON) ───
  let body: { menu_id?: string; source?: string } = {};
  try {
    body = await req.json();
  } catch {
    // sendBeacon puede enviar texto plano
    try {
      const text = await req.text();
      body = JSON.parse(text);
    } catch {
      return new NextResponse(null, { status: 400 });
    }
  }

  const menuId = body.menu_id;
  const source = (body.source === 'cart' || body.source === 'social' || body.source === 'direct')
    ? body.source
    : 'direct';

  if (!menuId || typeof menuId !== 'string') {
    return new NextResponse(null, { status: 400 });
  }

  // ─── Validar UUID (evita inyección) ───
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(menuId)) {
    return new NextResponse(null, { status: 400 });
  }

  // ─── Insertar (fire-and-forget pero esperamos para confirmar) ───
  try {
    const supabase = await createClient();
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null;

    const { error } = await supabase
      .from('whatsapp_clicks')
      .insert({
        menu_id: menuId,
        ip,
        user_agent: userAgent,
        source,
      });

    if (error) {
      // Si es RLS o FK violation, fallo silencioso (no romper UX del cliente)
      console.error('[track/whatsapp-click] insert error:', error.message);
      return new NextResponse(null, { status: 204 }); // igual respondemos 204 para no romper el beacon
    }

    return new NextResponse(null, { status: 204 });
  } catch (e: any) {
    console.error('[track/whatsapp-click] exception:', e?.message || e);
    return new NextResponse(null, { status: 204 }); // no romper UX
  }
}

// OPTIONS para CORS preflight (sendBeacon desde /r/[slug] mismo origen, pero por seguridad)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
