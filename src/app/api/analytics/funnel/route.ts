import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PLANS, type PlanId, isPlanAtLeast } from '@/lib/plans';

/**
 * GET /api/analytics/funnel
 * Datos para el gráfico de embudo — plan-aware.
 *
 * Niveles del embudo (plan-aware):
 *  FREE/PRO:
 *    1. Visitas al menú (menu_views)
 *    2. Clics WhatsApp (derivado de social_whatsapp visible)
 *    3. Pedidos WhatsApp (estimación)
 *  PREMIUM (agrega):
 *    4. Comandas creadas (orders)
 *    5. Comandas enviadas (orders.status in enviada+)
 *    6. Comandas entregadas
 *  FULL (agrega todo):
 *    7. Comandas facturadas
 *    8. Conversión final
 *    + Comparativa con período anterior
 *    + Datos demográficos (top países/ciudades si disponibles)
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();

  const planId = (profile?.plan as PlanId) || 'free';
  const plan = PLANS[planId] || PLANS.free;

  // Tier flags
  const isPro = isPlanAtLeast(planId, 'pro');
  const isPremium = isPlanAtLeast(planId, 'premium');
  const isFull = isPlanAtLeast(planId, 'full');

  // Rango
  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const endDate = to ? new Date(to) : new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  startDate.setHours(0, 0, 0, 0);

  // ───── 1. Visitas al menú ─────
  const { count: totalViews } = await supabase
    .from('menu_views')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Visitas únicas por IP — usar count head + group por IP vía RPC sería ideal,
  // pero para mantenerlo simple hacemos select solo de ip (columna ligera)
  const { data: uniqueIpRows } = await supabase
    .from('menu_views')
    .select('ip')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const uniqueIps = new Set((uniqueIpRows || []).map(r => r.ip || 'unknown')).size;

  // ───── 2. Clics WhatsApp REALES (de whatsapp_clicks table) ─────
  // Tracking real vía pixel en menú público (POST /api/track/whatsapp-click)
  // Reemplaza la antigua estimación del 25% — ahora es 100% real.
  const { count: realWhatsappClicks } = await supabase
    .from('whatsapp_clicks')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Tambien clics por source (cart vs social)
  const { data: clickBySourceRows } = await supabase
    .from('whatsapp_clicks')
    .select('source')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const clicksBySource = (clickBySourceRows || []).reduce((acc: { cart: number; social: number; direct: number }, r: any) => {
    const s = r.source || 'direct';
    if (s === 'cart') acc.cart++;
    else if (s === 'social') acc.social++;
    else acc.direct++;
    return acc;
  }, { cart: 0, social: 0, direct: 0 });

  // ───── 3. Pedidos por canal (si Premium+) ─────
  let ordersData: any[] = [];
  if (isPremium) {
    const { data: ords } = await supabase
      .from('orders')
      .select('id, status, order_type, total, created_at')
      .eq('owner_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    ordersData = ords || [];
  }

  // ───── Construir niveles del embudo ─────
  const visits = totalViews || 0;
  const uniqueVisits = uniqueIps;

  // Clics WhatsApp REALES (ya no estimación 25%)
  const whatsappClicks = realWhatsappClicks || 0;

  // WhatsApp orders estimadas (60% de clics → pedidos efectivos)
  // (se mantiene estimación porque no podemos saber si el cliente efectivamente
  //  envió el mensaje en WhatsApp — solo sabemos que hizo clic)
  const whatsappOrders = Math.floor(whatsappClicks * 0.6);

  // Verificar si el menú tiene WhatsApp configurado (para saber si mostrar etapa)
  const { data: menusWithWhatsapp } = await supabase
    .from('menus')
    .select('id, name, whatsapp, social_whatsapp')
    .eq('user_id', user.id);
  const menusWhatsapp = (menusWithWhatsapp || []).filter(m => m.whatsapp || m.social_whatsapp).length;

  let comandasCreadas = 0;
  let comandasEnviadas = 0;
  let comandasEnPreparacion = 0;
  let comandasListas = 0;
  let comandasEntregadas = 0;
  let comandasFacturadas = 0;
  let ventasTotales = 0;

  if (isPremium && ordersData.length > 0) {
    comandasCreadas = ordersData.length;
    comandasEnviadas = ordersData.filter(o => ['enviada', 'en_preparacion', 'lista', 'entregada', 'facturada'].includes(o.status)).length;
    comandasEnPreparacion = ordersData.filter(o => ['en_preparacion', 'lista', 'entregada', 'facturada'].includes(o.status)).length;
    comandasListas = ordersData.filter(o => ['lista', 'entregada', 'facturada'].includes(o.status)).length;
    comandasEntregadas = ordersData.filter(o => ['entregada', 'facturada'].includes(o.status)).length;
    comandasFacturadas = ordersData.filter(o => o.status === 'facturada').length;
    ventasTotales = ordersData
      .filter(o => ['entregada', 'facturada'].includes(o.status))
      .reduce((s, o) => s + Number(o.total || 0), 0);
  }

  // Build funnel stages according to plan
  const stages: { label: string; value: number; color: string; pct?: number }[] = [];

  // Always: visits
  stages.push({ label: 'Visitas al menú', value: visits, color: '#118ab2' });

  if (isPro) {
    stages.push({ label: 'Visitas únicas (IP)', value: uniqueVisits, color: '#06d6a0' });
  }

  if (menusWhatsapp > 0) {
    stages.push({ label: 'Clics WhatsApp', value: whatsappClicks, color: '#25D366' });
    stages.push({ label: 'Pedidos WhatsApp', value: whatsappOrders, color: '#d4af37' });
  }

  if (isPremium) {
    stages.push({ label: 'Comandas creadas', value: comandasCreadas, color: '#9d4edd' });
    stages.push({ label: 'Enviadas a cocina', value: comandasEnviadas, color: '#c77dff' });
    stages.push({ label: 'En preparación', value: comandasEnPreparacion, color: '#ff6b35' });
    stages.push({ label: 'Listas para entregar', value: comandasListas, color: '#06d6a0' });
    stages.push({ label: 'Entregadas', value: comandasEntregadas, color: '#118ab2' });
  }

  if (isFull) {
    stages.push({ label: 'Facturadas', value: comandasFacturadas, color: '#e63946' });
  }

  // Calcular % de conversión etapa por etapa
  const stagesWithPct = stages.map((s, i) => {
    if (i === 0) return { ...s, pct: 100 };
    const prev = stages[i - 1].value;
    const pct = prev > 0 ? (s.value / prev) * 100 : 0;
    return { ...s, pct: Math.round(pct) };
  });

  // Conversión global
  const finalStage = stagesWithPct[stagesWithPct.length - 1];
  const conversionGlobal = visits > 0 ? ((finalStage.value / visits) * 100) : 0;

  // ───── Datos adicionales FULL ─────
  let extras: any = {};

  if (isFull) {
    // Top platos del período (de order_items)
    const { data: topItems } = await supabase
      .from('order_items')
      .select(`
        menu_item_name,
        quantity,
        menu_item_price,
        order:orders!inner(status, created_at, owner_id)
      `)
      .eq('order.owner_id', user.id)
      .in('order.status', ['entregada', 'facturada'])
      .gte('order.created_at', startDate.toISOString())
      .lte('order.created_at', endDate.toISOString());

    const topMap = new Map<string, { cantidad: number; ventas: number }>();
    (topItems || []).forEach((it: any) => {
      const key = it.menu_item_name;
      const cur = topMap.get(key) || { cantidad: 0, ventas: 0 };
      cur.cantidad += it.quantity;
      cur.ventas += Number(it.menu_item_price) * it.quantity;
      topMap.set(key, cur);
    });
    extras.topPlatos = Array.from(topMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10);

    // Top mozos
    const { data: topWaiters } = await supabase
      .from('orders')
      .select(`
        total, status,
        waiter:waiters(full_name)
      `)
      .eq('owner_id', user.id)
      .in('status', ['entregada', 'facturada'])
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const waiterMap = new Map<string, { comandas: number; ventas: number }>();
    (topWaiters || []).forEach((o: any) => {
      const name = o.waiter?.full_name || 'Sin mozo';
      const cur = waiterMap.get(name) || { comandas: 0, ventas: 0 };
      cur.comandas += 1;
      cur.ventas += Number(o.total || 0);
      waiterMap.set(name, cur);
    });
    extras.topMozos = Array.from(waiterMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10);

    extras.ventasTotales = ventasTotales;
  }

  // Comparativa período anterior
  const daysDiff = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(startDate.getTime() - daysDiff * 86400000);

  const { count: prevVisits } = await supabase
    .from('menu_views')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', prevStart.toISOString())
    .lt('created_at', prevEnd.toISOString());

  // Previous period WhatsApp clicks for delta
  const { count: prevWhatsappClicks } = await supabase
    .from('whatsapp_clicks')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', prevStart.toISOString())
    .lt('created_at', prevEnd.toISOString());

  const deltaWhatsappClicks = whatsappClicks > 0 && (prevWhatsappClicks || 0) > 0
    ? Number((((whatsappClicks - (prevWhatsappClicks || 0)) / (prevWhatsappClicks || 1)) * 100).toFixed(1))
    : 0;

  return NextResponse.json({
    plan: { id: planId, name: plan.name, isPro, isPremium, isFull },
    rango: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      dias: daysDiff,
    },
    funnel: stagesWithPct,
    kpis: {
      visitas: visits,
      visitasUnicas: uniqueVisits,
      clicsWhatsapp: whatsappClicks,
      clicsWhatsappPorSource: clicksBySource,
      prevWhatsappClicks: prevWhatsappClicks || 0,
      deltaWhatsappClicks,
      pedidosWhatsapp: whatsappOrders,
      comandasCreadas,
      comandasEntregadas,
      comandasFacturadas,
      ventasTotales,
      conversionGlobal: Number(conversionGlobal.toFixed(2)),
      prevVisits: prevVisits || 0,
      deltaVisitas: visits > 0 && (prevVisits || 0) > 0
        ? Number((((visits - (prevVisits || 0)) / (prevVisits || 1)) * 100).toFixed(1))
        : 0,
    },
    extras,
  });
}
