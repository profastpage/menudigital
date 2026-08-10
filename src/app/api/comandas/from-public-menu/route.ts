import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { PLANS, type PlanId } from '@/lib/plans';

/**
 * POST /api/comandas/from-public-menu
 *
 * Crea una comanda interna cuando un cliente final envía un pedido desde
 * la carta digital pública (/r/[slug]). Solo para planes Premium y Full.
 *
 * No requiere sesión de usuario (el cliente final no está autenticado).
 * Usa SUPABASE_SERVICE_ROLE_KEY para bypass RLS y ejecuta la RPC
 * `create_order_from_public_menu` que:
 *   1. Valida que el menú exista
 *   2. Verifica que el owner del menú tenga plan Premium/Full
 *   3. Auto-asigna un mozo libre
 *   4. Crea la comanda con status='enviada'
 *   5. Crea notificaciones push (new_order para cocina, order_assigned para mozo)
 *
 * Body: {
 *   menu_id: string,
 *   customer_name?: string,
 *   customer_phone?: string,
 *   customer_table?: string,        // número de mesa opcional
 *   order_type?: 'mesa'|'para_llevar'|'delivery',
 *   notes?: string,
 *   items: [{
 *     menu_item_id: string,
 *     menu_item_name: string,
 *     menu_item_price: number,
 *     quantity: number,
 *     notes?: string
 *   }]
 * }
 *
 * Response: {
 *   ok: true,
 *   order_id, order_number, waiter_id?, status, subtotal,
 *   whatsapp_also: true   // el frontend ya abrió WhatsApp
 * }
 * o
 * { ok: false, error: '...', code: '...' } con código:
 *   - 'menu_not_found'
 *   - 'plan_not_eligible'   (Free/Pro no tienen comanda interna)
 *   - 'no_items'
 *   - 'rate_limited'
 */
export async function POST(req: NextRequest) {
  // Rate limit básico por IP (anti-spam)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') || 'unknown';

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido', code: 'invalid_json' }, { status: 400 });
  }

  const {
    menu_id,
    customer_name,
    customer_phone,
    customer_table,
    order_type,
    notes,
    items,
  } = body || {};

  if (!menu_id || typeof menu_id !== 'string') {
    return NextResponse.json({ ok: false, error: 'menu_id requerido', code: 'menu_not_found' }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ ok: false, error: 'La comanda debe tener al menos 1 item', code: 'no_items' }, { status: 400 });
  }

  // Validar items
  for (const it of items) {
    if (typeof it.quantity !== 'number' || it.quantity < 1 || it.quantity > 99) {
      return NextResponse.json({ ok: false, error: 'Cantidad inválida (1-99)', code: 'invalid_qty' }, { status: 400 });
    }
    if (typeof it.menu_item_price !== 'number' || it.menu_item_price < 0) {
      return NextResponse.json({ ok: false, error: 'Precio inválido', code: 'invalid_price' }, { status: 400 });
    }
    if (!it.menu_item_name || typeof it.menu_item_name !== 'string') {
      return NextResponse.json({ ok: false, error: 'Nombre de plato requerido', code: 'invalid_name' }, { status: 400 });
    }
  }

  const service = createServiceClient();
  if (!service) {
    return NextResponse.json(
      { ok: false, error: 'Service client no configurado', code: 'server_config' },
      { status: 500 }
    );
  }

  // 1. Verificar menú + plan del owner
  const { data: menu, error: menuErr } = await service
    .from('menus')
    .select('id, user_id, name, currency, is_published')
    .eq('id', menu_id)
    .single();

  if (menuErr || !menu) {
    return NextResponse.json({ ok: false, error: 'Menú no encontrado', code: 'menu_not_found' }, { status: 404 });
  }
  const menuData = menu as any;
  if (!menuData.is_published) {
    return NextResponse.json({ ok: false, error: 'Menú no publicado', code: 'menu_not_published' }, { status: 403 });
  }

  const { data: profile } = await service
    .from('profiles')
    .select('plan')
    .eq('id', menuData.user_id)
    .single();

  const plan = PLANS[((profile as any)?.plan as PlanId) || 'free'] || PLANS.free;
  if (!plan.limits.hasComandas) {
    // Free/Pro: la comanda interna no aplica, solo WhatsApp
    return NextResponse.json({
      ok: false,
      error: 'Este plan no incluye comanda interna',
      code: 'plan_not_eligible',
      whatsapp_only: true,
    }, { status: 200 }); // 200 para que el frontend no lo trate como error
  }

  // 2. Rate limit: máximo 50 comandas por owner cada 5 minutos (anti-spam)
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count: recentCount } = await service
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', menuData.user_id)
    .gte('created_at', fiveMinAgo);
  if (recentCount && recentCount > 50) {
    return NextResponse.json({ ok: false, error: 'Demasiados pedidos, intenta más tarde', code: 'rate_limited' }, { status: 429 });
  }

  // 3. Ejecutar la RPC
  const payload = {
    menu_id,
    customer_name: customer_name || null,
    customer_phone: customer_phone || null,
    customer_table: customer_table || null,
    order_type: order_type || 'para_llevar',
    notes: notes || null,
    items: items.map((it: any) => ({
      menu_item_id: it.menu_item_id,
      menu_item_name: it.menu_item_name,
      menu_item_price: it.menu_item_price,
      quantity: it.quantity,
      notes: it.notes || null,
    })),
  };

  const { data: result, error: rpcErr } = await (service as any)
    .rpc('create_order_from_public_menu', { p_payload: payload });

  if (rpcErr) {
    console.error('[from-public-menu] RPC error:', rpcErr);
    return NextResponse.json({ ok: false, error: rpcErr.message, code: 'rpc_error' }, { status: 500 });
  }

  const resultData = result as any;
  if (!resultData || resultData.error) {
    const errCode = resultData?.error || 'unknown';
    return NextResponse.json({ ok: false, error: errCode, code: errCode }, { status: 400 });
  }

  // 4. Log para debugging (sin datos sensibles)
  console.log(`[from-public-menu] ✓ Order ${resultData.order_number} created for menu ${menu_id} (waiter=${resultData.waiter_id || 'none'}, subtotal=${resultData.subtotal}, ip=${ip})`);

  return NextResponse.json({
    ok: true,
    order_id: resultData.order_id,
    order_number: resultData.order_number,
    waiter_id: resultData.waiter_id,
    status: resultData.status,
    subtotal: resultData.subtotal,
    whatsapp_also: true,
  });
}

/**
 * GET /api/comandas/from-public-menu?menu_id=xxx
 * Permite al frontend de la carta pública saber si el menú tiene comanda interna habilitada
 * (Premium/Full). No requiere auth.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const menuId = url.searchParams.get('menu_id');
  if (!menuId) return NextResponse.json({ enabled: false }, { status: 400 });

  const service = createServiceClient();
  if (!service) return NextResponse.json({ enabled: false });

  const { data: menu } = await service
    .from('menus')
    .select('user_id')
    .eq('id', menuId)
    .single();
  if (!menu) return NextResponse.json({ enabled: false });
  const userId = (menu as any).user_id;

  const { data: profile } = await service
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = PLANS[((profile as any)?.plan as PlanId) || 'free'] || PLANS.free;
  return NextResponse.json({ enabled: !!plan.limits.hasComandas, plan: plan.id });
}
