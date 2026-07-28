import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/analytics/daily-sales
 *
 * Devuelve ventas por día para el chart "Ventas por día".
 * Funciona en TODOS los planes (no requiere Full).
 *
 * Query params:
 *   ?days=30  → número de días hacia atrás (default 30, max 90)
 *
 * Devuelve:
 *   { data: [{ fecha: "2024-01-15", num_comandas: 5, total_ventas: 250.50 }] }
 *
 * Solo cuenta órdenes facturadas o entregadas (no canceladas ni borrador).
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const url = new URL(req.url);
  const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10), 1), 90);

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  startDate.setHours(0, 0, 0, 0);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total, created_at, status')
    .eq('owner_id', user.id)
    .in('status', ['facturada', 'entregada'])
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Agrupar por día
  const porDiaMap = new Map<string, { fecha: string; num_comandas: number; total_ventas: number }>();
  for (const o of orders || []) {
    const d = new Date(o.created_at);
    const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const existing = porDiaMap.get(fecha) || { fecha, num_comandas: 0, total_ventas: 0 };
    existing.num_comandas += 1;
    existing.total_ventas += Number(o.total || 0);
    porDiaMap.set(fecha, existing);
  }

  // Llenar días sin ventas con ceros para que el chart sea continuo
  const data: { fecha: string; num_comandas: number; total_ventas: number }[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  while (cursor <= endDate) {
    const fecha = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const entry = porDiaMap.get(fecha);
    data.push(entry || { fecha, num_comandas: 0, total_ventas: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return NextResponse.json({
    data,
    rango: {
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      dias: days,
    },
  });
}
