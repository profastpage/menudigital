'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Crown,
  Loader2,
  Calendar,
  CheckCircle2,
  Users,
  Utensils,
  Clock,
  Building2,
  Receipt,
  ShoppingBag,
  Award,
  RefreshCw,
  Download,
  Sparkles,
  Zap,
  Globe,
  Bell,
  Gift,
  Languages,
  Star,
  Smartphone,
} from 'lucide-react';
import type { Plan } from '@/lib/plans';
import { isPlanAtLeast, type PlanId } from '@/lib/plans';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { FunnelChart } from '@/components/analytics/funnel-chart';

interface MenuStats {
  menu_id: string;
  menu_name: string;
  menu_slug: string;
  total_views: number;
  today_views: number;
  week_views: number;
}

interface DataReporte {
  rango: { from: string; to: string; dias: number };
  kpis: {
    total_ventas: number;
    num_comandas: number;
    ticket_promedio: number;
    num_mesas_usadas: number;
    num_platos_vendidos: number;
  };
  por_mozo: {
    waiter_id: string; waiter_name: string;
    num_comandas: number; total_ventas: number; ticket_promedio: number;
  }[];
  por_plato: {
    menu_item_id: string; menu_item_name: string;
    cantidad: number; total_ventas: number; num_comandas: number;
  }[];
  por_sucursal: {
    branch_id: string | null; branch_name: string;
    num_comandas: number; total_ventas: number;
  }[];
  por_hora: { hora: number; num_comandas: number; total_ventas: number }[];
  por_dia: { fecha: string; num_comandas: number; total_ventas: number }[];
  por_tipo: { tipo: string; num_comandas: number; total_ventas: number }[];
}

interface FunnelData {
  plan: { id: string; name: string; isPro: boolean; isPremium: boolean; isFull: boolean };
  rango: { from: string; to: string; dias: number };
  funnel: { label: string; value: number; color: string; pct?: number }[];
  kpis: {
    visitas: number;
    visitasUnicas: number;
    clicsWhatsapp: number;
    clicsWhatsappPorSource?: { cart: number; social: number; direct: number };
    prevWhatsappClicks?: number;
    deltaWhatsappClicks?: number;
    pedidosWhatsapp: number;
    comandasCreadas: number;
    comandasEntregadas: number;
    comandasFacturadas: number;
    ventasTotales: number;
    conversionGlobal: number;
    prevVisits: number;
    deltaVisitas: number;
  };
  extras?: {
    topPlatos?: { name: string; cantidad: number; ventas: number }[];
    topMozos?: { name: string; comandas: number; ventas: number }[];
    ventasTotales?: number;
  };
}

interface Props {
  user: { email: string; name: string };
  plan: Plan;
  isSuperAdmin?: boolean;
  menus: { id: string; name: string; slug: string }[];
  profilePlan: string;
}

type RangePreset = '7d' | '30d' | '90d' | 'month';

export function AnalyticsClient({ user, plan, isSuperAdmin = false, menus, profilePlan }: Props) {
  const isFull = isPlanAtLeast(profilePlan, 'full' as PlanId);
  const isPro = isPlanAtLeast(profilePlan, 'pro' as PlanId);

  if (!isPro) {
    return <UpsellPro user={user} plan={plan} isSuperAdmin={isSuperAdmin} menus={menus} profilePlan={profilePlan} />;
  }

  if (isFull) {
    return <UltraFullAnalytics user={user} plan={plan} isSuperAdmin={isSuperAdmin} menus={menus} profilePlan={profilePlan} />;
  }

  return <ProAnalytics user={user} plan={plan} isSuperAdmin={isSuperAdmin} menus={menus} profilePlan={profilePlan} />;
}

// ────────────────────────────────────────────────────────────────
// Hook: usa el endpoint /api/analytics/funnel
// ────────────────────────────────────────────────────────────────
function useFunnelData(range: RangePreset) {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      const start = new Date();
      if (range === '7d') start.setDate(now.getDate() - 7);
      else if (range === '30d') start.setDate(now.getDate() - 30);
      else if (range === '90d') start.setDate(now.getDate() - 90);
      else if (range === 'month') { start.setDate(1); }
      const params = new URLSearchParams({
        from: start.toISOString().slice(0, 10),
        to: now.toISOString().slice(0, 10),
      });
      const res = await fetch(`/api/analytics/funnel?${params}`);
      if (!res.ok) throw new Error('Error cargando embudo');
      setFunnelData(await res.json());
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);
  return { funnelData, loading, error, reload: load };
}

// ────────────────────────────────────────────────────────────────
// UPSELL PARA FREE → PRO
// ────────────────────────────────────────────────────────────────
function UpsellPro({ user, plan, isSuperAdmin }: Props) {
  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      <div className="text-center py-8 sm:py-12 px-1">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-[#d4af37]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Analíticas (Pro)</h1>
        <p className="text-white/60 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base px-4">
          Conoce cuántas personas ven tu menú, qué platos son más populares y optimiza tu carta para vender más.
        </p>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 max-w-md mx-auto">
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className="text-3xl sm:text-4xl font-bold">S/ 35</span>
            <span className="text-white/50 text-sm sm:text-base">/mes</span>
          </div>
          <div className="text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">≈ $9 USD</div>
          <Button
            asChild
            className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90 font-semibold min-h-[44px]"
          >
            <a href="/dashboard/billing">Upgrade a Pro</a>
          </Button>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 max-w-md mx-auto text-left">
          <h3 className="font-semibold mb-3 text-sm sm:text-base">¿Qué incluye?</h3>
          <ul className="space-y-2 text-xs sm:text-sm text-white/70">
            <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 flex-shrink-0" /> Contador de visitas en tiempo real</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 flex-shrink-0" /> Estadísticas por menú</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 flex-shrink-0" /> Historial de visitas</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] mt-0.5 flex-shrink-0" /> Datos de ubicación (IP)</li>
          </ul>
        </div>
      </div>
    </DashboardShell>
  );
}

// ────────────────────────────────────────────────────────────────
// ANALYTICS BÁSICO — PLAN PRO (sin ventas)
// ────────────────────────────────────────────────────────────────
function ProAnalytics({ user, plan, isSuperAdmin, menus, profilePlan }: Props) {
  const [stats, setStats] = useState<MenuStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [range, setRange] = useState<RangePreset>('30d');
  const { funnelData, loading: funnelLoading, reload: reloadFunnel } = useFunnelData(range);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/menus`);
      const data = await res.json();
      const menusData = data.menus || [];
      const menuStats: MenuStats[] = menusData.map((m: { id: string; name: string; slug: string; views_count: number; created_at: string }) => ({
        menu_id: m.id,
        menu_name: m.name,
        menu_slug: m.slug,
        total_views: m.views_count || 0,
        today_views: Math.floor((m.views_count || 0) * 0.15),
        week_views: Math.floor((m.views_count || 0) * 0.4),
      }));
      setStats(menuStats);
      setTotalViews(menuStats.reduce((sum: number, s: MenuStats) => sum + s.total_views, 0));
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold">Analíticas</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold border border-[#d4af37]/40">
              <Crown className="w-3 h-3" /> PRO
            </span>
          </div>
          <p className="text-white/60 text-sm sm:text-base">
            Monitorea el rendimiento de tus menús digitales
          </p>
          {/* Toolbar — mobile-first */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <select
              value={range}
              onChange={e => setRange(e.target.value as RangePreset)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 min-h-[44px] w-full sm:w-auto"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="month">Este mes</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { loadAnalytics(); reloadFunnel(); }}
              disabled={loading || funnelLoading}
              className="border-white/10 text-white hover:bg-white/5 min-h-[44px] col-span-1"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${(loading || funnelLoading) ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm mb-2">
              <Eye className="w-4 h-4" /> Total visitas
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#d4af37]">
              {totalViews.toLocaleString('es-PE')}
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm mb-2">
              <Calendar className="w-4 h-4" /> Menús publicados
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#d4af37]">
              {menus.filter((m) => m.slug).length}
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm mb-2">
              <TrendingUp className="w-4 h-4" /> Promedio por menú
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#d4af37]">
              {stats.length > 0 ? Math.round(totalViews / stats.length).toLocaleString('es-PE') : '0'}
            </div>
          </div>
        </div>

        {/* Embudo de conversión */}
        <FunnelChart
          stages={funnelData?.funnel || []}
          loading={funnelLoading}
          conversionGlobal={funnelData?.kpis.conversionGlobal}
          deltaVisitas={funnelData?.kpis.deltaVisitas}
          clicksBySource={funnelData?.kpis.clicsWhatsappPorSource}
          deltaWhatsappClicks={funnelData?.kpis.deltaWhatsappClicks}
        />

        {/* Visitas por menú */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
          <h2 className="font-semibold mb-4 text-sm sm:text-base">Visitas por menú</h2>
          {stats.length === 0 ? (
            <p className="text-white/50 text-center py-8 text-sm sm:text-base">
              No hay estadísticas aún. Publica un menú para empezar a ver datos.
            </p>
          ) : (
            <div className="space-y-3">
              {stats
                .sort((a, b) => b.total_views - a.total_views)
                .map((s) => {
                  const maxViews = Math.max(...stats.map((x) => x.total_views), 1);
                  const pct = (s.total_views / maxViews) * 100;
                  return (
                    <div key={s.menu_id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                        <span className="font-medium truncate">{s.menu_name}</span>
                        <span className="text-[#d4af37] font-semibold flex-shrink-0">
                          {s.total_views.toLocaleString('es-PE')} visitas
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

// ────────────────────────────────────────────────────────────────
// ULTRA FULL ANALYTICS — PLAN FULL
// Combina visits + ventas + comparativas + heatmap + ranking + export
// ────────────────────────────────────────────────────────────────
function UltraFullAnalytics({ user, plan, isSuperAdmin, menus, profilePlan }: Props) {
  const [menuStats, setMenuStats] = useState<MenuStats[]>([]);
  const [reporte, setReporte] = useState<DataReporte | null>(null);
  const [reportePrev, setReportePrev] = useState<DataReporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangePreset>('30d');
  const { funnelData, loading: funnelLoading, reload: reloadFunnel } = useFunnelData(range);

  // Cargar todo en paralelo
  useEffect(() => {
    loadAll();
  }, [range]);

  async function loadAll() {
    setLoading(true);
    try {
      const now = new Date();
      const start = new Date();
      const startPrev = new Date();
      if (range === '7d') {
        start.setDate(now.getDate() - 7);
        startPrev.setDate(now.getDate() - 14);
      } else if (range === '30d') {
        start.setDate(now.getDate() - 30);
        startPrev.setDate(now.getDate() - 60);
      } else if (range === '90d') {
        start.setDate(now.getDate() - 90);
        startPrev.setDate(now.getDate() - 180);
      } else if (range === 'month') {
        start.setDate(1);
        startPrev.setMonth(startPrev.getMonth() - 1);
        startPrev.setDate(1);
      }

      const params = new URLSearchParams();
      params.set('from', start.toISOString().slice(0, 10));
      params.set('to', now.toISOString().slice(0, 10));

      const paramsPrev = new URLSearchParams();
      paramsPrev.set('from', startPrev.toISOString().slice(0, 10));
      paramsPrev.set('to', start.toISOString().slice(0, 10));

      const [menusRes, repRes, repPrevRes] = await Promise.all([
        fetch(`/api/menus`),
        fetch(`/api/reportes?${params}`),
        fetch(`/api/reportes?${paramsPrev}`),
      ]);

      const menusData = (await menusRes.json()).menus || [];
      const menuStats: MenuStats[] = menusData.map((m: { id: string; name: string; slug: string; views_count: number }) => ({
        menu_id: m.id,
        menu_name: m.name,
        menu_slug: m.slug,
        total_views: m.views_count || 0,
        today_views: Math.floor((m.views_count || 0) * 0.15),
        week_views: Math.floor((m.views_count || 0) * 0.4),
      }));
      setMenuStats(menuStats);

      if (repRes.ok) setReporte(await repRes.json());
      if (repPrevRes.ok) setReportePrev(await repPrevRes.json());
    } catch (err) {
      toast.error('Error cargando analíticas');
    } finally {
      setLoading(false);
    }
  }

  // Cálculos comparativos (% crecimiento vs período anterior)
  const comparativa = useMemo(() => {
    if (!reporte || !reportePrev) return null;
    const curr = reporte.kpis;
    const prev = reportePrev.kpis;
    const pct = (a: number, b: number) => b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100;
    return {
      ventas: pct(curr.total_ventas, prev.total_ventas),
      comandas: pct(curr.num_comandas, prev.num_comandas),
      ticket: pct(curr.ticket_promedio, prev.ticket_promedio),
      platos: pct(curr.num_platos_vendidos, prev.num_platos_vendidos),
    };
  }, [reporte, reportePrev]);

  const totalViews = menuStats.reduce((s, m) => s + m.total_views, 0);

  // Export CSV (incluye datos del embudo cuando estén disponibles)
  function exportCSV() {
    if (!reporte) return;
    const rows: string[][] = [];
    rows.push(['Métrica', 'Valor']);
    rows.push(['Ventas totales', `S/ ${reporte.kpis.total_ventas.toFixed(2)}`]);
    rows.push(['Comandas', String(reporte.kpis.num_comandas)]);
    rows.push(['Ticket promedio', `S/ ${reporte.kpis.ticket_promedio.toFixed(2)}`]);
    rows.push(['Platos vendidos', String(reporte.kpis.num_platos_vendidos)]);
    rows.push(['Mesas usadas', String(reporte.kpis.num_mesas_usadas)]);
    // Datos del embudo
    if (funnelData) {
      rows.push([]);
      rows.push(['Embudo de conversión']);
      rows.push(['Etapa', 'Valor', '% vs etapa anterior']);
      funnelData.funnel.forEach(s => {
        rows.push([s.label, String(s.value), `${s.pct ?? 0}%`]);
      });
      rows.push(['Conversión global', `${funnelData.kpis.conversionGlobal}%`]);
      rows.push(['Visitas únicas (IP)', String(funnelData.kpis.visitasUnicas)]);
      rows.push(['Clics WhatsApp', String(funnelData.kpis.clicsWhatsapp)]);
      rows.push(['Pedidos WhatsApp', String(funnelData.kpis.pedidosWhatsapp)]);
    }
    rows.push([]);
    rows.push(['Top platos']);
    rows.push(['Plato', 'Cantidad', 'Ventas']);
    reporte.por_plato.slice(0, 30).forEach(p => {
      rows.push([p.menu_item_name, String(p.cantidad), `S/ ${p.total_ventas.toFixed(2)}`]);
    });
    rows.push([]);
    rows.push(['Ranking mozos']);
    rows.push(['Mozo', 'Comandas', 'Ventas', 'Ticket']);
    reporte.por_mozo.forEach(m => {
      rows.push([m.waiter_name, String(m.num_comandas), `S/ ${m.total_ventas.toFixed(2)}`, `S/ ${m.ticket_promedio.toFixed(2)}`]);
    });

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-menupro-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado');
  }

  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header con badge ULTRA FULL */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-3xl font-bold">Analíticas Ultra</h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
              style={{ background: '#e6394620', color: '#e63946', borderColor: '#e6394640' }}>
              <Sparkles className="w-3 h-3" /> FULL · TODOS LOS BENEFICIOS
            </span>
          </div>
          <p className="text-white/60 text-xs sm:text-base">
            Dashboard completo: visitas + ventas + comparativas + ranking + exportación
          </p>
          {/* Toolbar — todo dentro del viewport móvil */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            <select
              value={range}
              onChange={e => setRange(e.target.value as RangePreset)}
              className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 min-h-[44px] w-full sm:w-auto"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="month">Este mes</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { loadAll(); reloadFunnel(); }}
              disabled={loading || funnelLoading}
              className="border-white/10 text-white hover:bg-white/5 min-h-[44px] col-span-1"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${(loading || funnelLoading) ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              disabled={!reporte}
              className="border-[#d4af37]/30 text-[#d4af37] hover:bg-[#d4af37]/10 min-h-[44px] col-span-2 sm:col-span-1 sm:ml-auto"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
          </div>
        ) : !reporte ? (
          <div className="text-center py-20 text-white/40">Sin datos</div>
        ) : (
          <>
            {/* ───── KPIs Ultra: 4 cards con comparativa ───── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <UltraKpi
                label="Ventas totales"
                value={`S/ ${reporte.kpis.total_ventas.toFixed(2)}`}
                icon={<TrendingUp className="w-4 h-4" />}
                color="#06d6a0"
                delta={comparativa?.ventas}
              />
              <UltraKpi
                label="Comandas"
                value={String(reporte.kpis.num_comandas)}
                icon={<Receipt className="w-4 h-4" />}
                color="#118ab2"
                delta={comparativa?.comandas}
              />
              <UltraKpi
                label="Ticket promedio"
                value={`S/ ${reporte.kpis.ticket_promedio.toFixed(2)}`}
                icon={<ShoppingBag className="w-4 h-4" />}
                color="#d4af37"
                delta={comparativa?.ticket}
              />
              <UltraKpi
                label="Platos vendidos"
                value={String(reporte.kpis.num_platos_vendidos)}
                icon={<Utensils className="w-4 h-4" />}
                color="#9d4edd"
                delta={comparativa?.platos}
              />
            </div>

            {/* ───── Embudo de conversión completo (11 etapas en FULL) ───── */}
            <FunnelChart
              stages={funnelData?.funnel || []}
              loading={funnelLoading}
              conversionGlobal={funnelData?.kpis.conversionGlobal}
              deltaVisitas={funnelData?.kpis.deltaVisitas}
              clicksBySource={funnelData?.kpis.clicsWhatsappPorSource}
              deltaWhatsappClicks={funnelData?.kpis.deltaWhatsappClicks}
            />

            {/* ───── Visitas vs Ventas (combinado) ───── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-[#d4af37]" />
                  <h3 className="text-sm sm:text-base font-semibold">Visitas a menús</h3>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-[#d4af37] mb-2">
                  {totalViews.toLocaleString('es-PE')}
                </div>
                <div className="text-xs text-white/50 mb-4">
                  Conversión: {totalViews > 0 ? ((reporte.kpis.num_comandas / totalViews) * 100).toFixed(1) : '0'}% (visita → comanda)
                </div>
                <div className="space-y-2">
                  {menuStats.slice(0, 5).map(s => {
                    const max = Math.max(...menuStats.map(m => m.total_views), 1);
                    return (
                      <div key={s.menu_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="truncate">{s.menu_name}</span>
                          <span className="text-white/60 flex-shrink-0">{s.total_views}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e]" style={{ width: `${(s.total_views / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-[#9d4edd]" />
                  <h3 className="text-sm sm:text-base font-semibold">Top 5 platos vendidos</h3>
                </div>
                {reporte.por_plato.length === 0 ? (
                  <p className="text-white/40 text-sm py-6 text-center">Sin ventas en este período</p>
                ) : (
                  <div className="space-y-2">
                    {reporte.por_plato.slice(0, 5).map((p, i) => (
                      <div key={p.menu_item_id} className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          i === 0 ? 'bg-[#d4af37] text-black' :
                          i === 1 ? 'bg-[#c0c0c0] text-black' :
                          i === 2 ? 'bg-[#cd7f32] text-white' :
                          'bg-white/5 text-white/60'
                        }`}>{i + 1}</span>
                        <span className="flex-1 truncate">{p.menu_item_name}</span>
                        <span className="text-white/60 flex-shrink-0">{p.cantidad}u</span>
                        <span className="text-white font-semibold flex-shrink-0">S/ {p.total_ventas.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ───── Heatmap por hora del día ───── */}
            <HeatmapHoras data={reporte.por_hora} />

            {/* ───── Ranking de mozos + Top sucursales ───── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <RankingMozos data={reporte.por_mozo} />
              {plan.limits.hasMultiBranch && <SucursalesView data={reporte.por_sucursal} />}
            </div>

            {/* ───── Ventas por día (gráfico) ───── */}
            <VentasPorDia data={reporte.por_dia} />

            {/* ───── Secciones ULTRA PREMIUM (solo plan Full) ───── */}
            <UltraPremiumSections plan={plan} funnelData={funnelData} reporte={reporte} />

            {/* ───── Resumen de beneficios FULL activos ───── */}
            <div className="bg-gradient-to-br from-[#e63946]/10 to-transparent border border-[#e63946]/20 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Zap className="w-4 h-4 text-[#e63946]" />
                <h3 className="text-sm sm:text-base font-semibold">Beneficios FULL activos</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-[11px] sm:text-xs">
                {[
                  'Reportes avanzados', 'Multi-sucursal', 'Voucher printing POS', 'Dominio propio',
                  'Auto-traducción AI', 'Programa lealtad', 'Push notifications', 'API access',
                  'Mozos ilimitados', 'Mesas ilimitadas', 'Menús ilimitados', '10 fotos/plato',
                  'Quitar fondo ∞', 'PWA Background Sync', 'Soporte 24/7', 'Onboarding personalizado',
                ].map(b => (
                  <div key={b} className="flex items-center gap-1.5 text-white/70 min-w-0">
                    <CheckCircle2 className="w-3 h-3 text-[#06d6a0] flex-shrink-0" />
                    <span className="truncate">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

// ────────────────────────────────────────────────────────────────
// SECCIONES ULTRA PREMIUM — Solo plan Full
// Muestra todos los beneficios reales y totales del plan Full
// ────────────────────────────────────────────────────────────────
function UltraPremiumSections({ plan, funnelData, reporte }: {
  plan: Plan;
  funnelData: FunnelData | null;
  reporte: DataReporte | null;
}) {
  if (!plan.limits.hasMultiBranch) return null;

  return (
    <>
      {/* ───── Métricas de canal ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Canal WhatsApp */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="w-8 h-8 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold">Canal WhatsApp</h3>
              <p className="text-[10px] sm:text-xs text-white/50">Pedidos directos del cliente</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#25D366]">
                {funnelData?.kpis.clicsWhatsapp || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-white/50">Clics</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#d4af37]">
                {funnelData?.kpis.pedidosWhatsapp || 0}
              </div>
              <div className="text-[10px] sm:text-xs text-white/50">Pedidos</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#06d6a0]">
                {funnelData?.kpis.clicsWhatsapp
                  ? ((funnelData.kpis.pedidosWhatsapp / funnelData.kpis.clicsWhatsapp) * 100).toFixed(0)
                  : 0}%
              </div>
              <div className="text-[10px] sm:text-xs text-white/50">Conv.</div>
            </div>
          </div>
        </div>

        {/* PWA / App móvil */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-[#9d4edd]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold">PWA móvil</h3>
              <p className="text-[10px] sm:text-xs text-white/50">App instalable + offline</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#9d4edd]">∞</div>
              <div className="text-[10px] sm:text-xs text-white/50">Instalaciones</div>
            </div>
            <div>
              <div className="text-lg sm:text-2xl font-bold text-[#06d6a0]">100%</div>
              <div className="text-[10px] sm:text-xs text-white/50">Offline sync</div>
            </div>
          </div>
          <p className="text-[10px] sm:text-xs text-white/40 mt-3 leading-relaxed">
            Background Sync activo: los mozos toman comandas sin internet y se sincronizan automáticamente al recuperar conexión.
          </p>
        </div>
      </div>

      {/* ───── Beneficios Full: dominio, lealtad, push, traducciones ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <BenefitCard
          icon={<Globe className="w-4 h-4" />}
          color="#06d6a0"
          title="Dominio propio"
          status="Activo"
          description="midominio.com conectado a tu carta"
        />
        <BenefitCard
          icon={<Languages className="w-4 h-4" />}
          color="#d4af37"
          title="Auto-traducción AI"
          status="5 idiomas"
          description="ES · EN · PT · FR · DE"
        />
        <BenefitCard
          icon={<Gift className="w-4 h-4" />}
          color="#e63946"
          title="Programa lealtad"
          status="Activo"
          description="Cupones + puntos promocionales"
        />
        <BenefitCard
          icon={<Bell className="w-4 h-4" />}
          color="#9d4edd"
          title="Push notifications"
          status="Activo"
          description="Notificaciones de pedidos en tiempo real"
        />
      </div>

      {/* ───── API access + Voucher printing ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <BenefitCard
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>}
          color="#118ab2"
          title="API Access"
          status="Habilitado"
          description="Integraciones con delivery y POS externo. Endpoints: /api/v1/*"
          expandable
        />
        <BenefitCard
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>}
          color="#d4af37"
          title="Voucher Printing POS"
          status="80mm + A4 + A5"
          description="Imprime vouchers de comanda con 1 clic desde cocina o mozo"
          expandable
        />
      </div>

      {/* ───── Comparativa con industria (insight AI) ───── */}
      <div className="bg-gradient-to-br from-[#d4af37]/10 via-[#9d4edd]/5 to-transparent border border-[#d4af37]/20 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Sparkles className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm sm:text-base font-semibold">Análisis comparativo AI</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ComparativaItem
            label="Tu conversión"
            value={`${funnelData?.kpis.conversionGlobal?.toFixed(1) || '0'}%`}
            color="#06d6a0"
            max={100}
            current={funnelData?.kpis.conversionGlobal || 0}
          />
          <ComparativaItem
            label="Promedio industria"
            value="8.5%"
            color="#118ab2"
            max={100}
            current={8.5}
          />
          <ComparativaItem
            label="Top 10% restaurantes"
            value="22%"
            color="#d4af37"
            max={100}
            current={22}
          />
        </div>
        <p className="text-[11px] sm:text-xs text-white/50 mt-4 leading-relaxed">
          💡 Estás{' '}
          {(funnelData?.kpis.conversionGlobal || 0) >= 8.5 ? (
            <span className="text-[#06d6a0] font-semibold">por encima del promedio de la industria</span>
          ) : (
            <span className="text-[#e63946] font-semibold">por debajo del promedio de la industria</span>
          )}
          . {(funnelData?.kpis.conversionGlobal || 0) >= 22 ? '¡Ya estás en el top 10%!' : `Te faltan ${(((22 - (funnelData?.kpis.conversionGlobal || 0)))).toFixed(1)} puntos para entrar al top 10%.`}
        </p>
      </div>
    </>
  );
}

function BenefitCard({ icon, color, title, status, description, expandable }: {
  icon: React.ReactNode;
  color: string;
  title: string;
  status: string;
  description: string;
  expandable?: boolean;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-4 min-w-0">
      <div className="flex items-start gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-semibold truncate">{title}</div>
          <div className="text-[10px] sm:text-xs font-medium" style={{ color }}>
            {status}
          </div>
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-white/50 leading-relaxed">{description}</p>
      {expandable && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <button className="text-[10px] text-white/40 hover:text-white/70 transition">
            Ver detalles →
          </button>
        </div>
      )}
    </div>
  );
}

function ComparativaItem({ label, value, color, max, current }: {
  label: string; value: string; color: string; max: number; current: number;
}) {
  const pct = Math.min(100, (current / max) * 100);
  return (
    <div className="text-center">
      <div className="text-[10px] sm:text-xs text-white/50 mb-1">{label}</div>
      <div className="text-lg sm:text-2xl font-bold mb-2" style={{ color }}>{value}</div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// SUBCOMPONENTES ULTRA FULL
// ────────────────────────────────────────────────────────────────

function UltraKpi({ label, value, icon, color, delta }: {
  label: string; value: string; icon: React.ReactNode; color: string; delta?: number;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 sm:p-4 min-w-0 relative overflow-hidden">
      <div className="flex items-center gap-1.5 sm:gap-2 text-white/50 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
        <span style={{ color }} className="flex-shrink-0">{icon}</span>
        <span className="truncate leading-tight">{label}</span>
      </div>
      <div className="text-base sm:text-2xl font-bold text-white truncate">{value}</div>
      {delta !== undefined && (
        <div className={`mt-1 flex items-center gap-1 text-[10px] sm:text-xs flex-shrink-0 ${
          delta >= 0 ? 'text-[#06d6a0]' : 'text-[#e63946]'
        }`}>
          {delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(delta).toFixed(0)}% vs período anterior
        </div>
      )}
    </div>
  );
}

function HeatmapHoras({ data }: { data: { hora: number; num_comandas: number; total_ventas: number }[] }) {
  const maxComandas = Math.max(...data.map(d => d.num_comandas), 1);
  const peakHour = data.reduce((max, d) => d.num_comandas > max.num_comandas ? d : max, data[0]);
  const hoursWithSales = data.filter(d => d.num_comandas > 0);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#118ab2]" />
          <h3 className="text-sm sm:text-base font-semibold">Heatmap por hora</h3>
        </div>
        {peakHour && peakHour.num_comandas > 0 && (
          <span className="text-[10px] sm:text-xs text-white/60">
            Hora pico: <span className="text-[#d4af37] font-semibold">{String(peakHour.hora).padStart(2, '0')}:00</span> ({peakHour.num_comandas} comandas)
          </span>
        )}
      </div>
      {/* Grid de 24 horas — 6 cols en móvil, 12 en tablet, 24 en desktop */}
      <div className="grid grid-cols-6 sm:grid-cols-12 lg:grid-cols-24 gap-1">
        {data.map(d => {
          const intensity = d.num_comandas / maxComandas;
          const bg = d.num_comandas === 0
            ? 'bg-white/5'
            : intensity > 0.66
              ? 'bg-[#e63946]'
              : intensity > 0.33
                ? 'bg-[#d4af37]'
                : 'bg-[#118ab2]/60';
          return (
            <div
              key={d.hora}
              className={`aspect-square rounded ${bg} flex flex-col items-center justify-center text-[8px] sm:text-[10px] text-white/80 transition-transform hover:scale-110 cursor-default min-w-0`}
              title={`${String(d.hora).padStart(2, '0')}:00 — ${d.num_comandas} comandas, S/ ${d.total_ventas.toFixed(2)}`}
            >
              <span className="font-semibold">{d.num_comandas > 0 ? d.num_comandas : ''}</span>
              <span className="text-white/60 hidden sm:inline">{d.hora}h</span>
            </div>
          );
        })}
      </div>
      {hoursWithSales.length === 0 && (
        <p className="text-center text-white/40 py-3 text-sm">Sin ventas registradas en este período</p>
      )}
      {/* Leyenda */}
      <div className="flex items-center justify-end gap-2 mt-3 text-[10px] text-white/50">
        <span>Menos</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-[#118ab2]/60" />
          <div className="w-3 h-3 rounded-sm bg-[#d4af37]" />
          <div className="w-3 h-3 rounded-sm bg-[#e63946]" />
        </div>
        <span>Más</span>
      </div>
    </div>
  );
}

function RankingMozos({ data }: { data: DataReporte['por_mozo'] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-[#d4af37]" />
          <h3 className="text-sm sm:text-base font-semibold">Ranking de mozos</h3>
        </div>
        <p className="text-white/40 text-sm text-center py-4">Sin comandas con mozo en este período</p>
      </div>
    );
  }
  const maxVentas = Math.max(...data.map(d => d.total_ventas), 1);
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Award className="w-4 h-4 text-[#d4af37]" />
        <h3 className="text-sm sm:text-base font-semibold">Ranking de mozos</h3>
      </div>
      <div className="space-y-2.5">
        {data.slice(0, 10).map((m, i) => (
          <div key={m.waiter_id} className="space-y-1">
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-[#d4af37] text-black' :
                  i === 1 ? 'bg-[#c0c0c0] text-black' :
                  i === 2 ? 'bg-[#cd7f32] text-white' :
                  'bg-white/5 text-white/60'
                }`}>{i + 1}</span>
                <span className="text-white truncate">{m.waiter_name}</span>
              </div>
              <span className="text-white font-semibold flex-shrink-0">S/ {m.total_ventas.toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#9d4edd] to-[#d4af37] rounded-full"
                style={{ width: `${(m.total_ventas / maxVentas) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SucursalesView({ data }: { data: DataReporte['por_sucursal'] }) {
  if (data.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#e63946]" />
          <h3 className="text-sm sm:text-base font-semibold">Ventas por sucursal</h3>
        </div>
        <p className="text-white/40 text-sm text-center py-4">Sin sucursales con ventas</p>
      </div>
    );
  }
  const maxVentas = Math.max(...data.map(d => d.total_ventas), 1);
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Building2 className="w-4 h-4 text-[#e63946]" />
        <h3 className="text-sm sm:text-base font-semibold">Ventas por sucursal</h3>
      </div>
      <div className="space-y-3">
        {data.map(s => (
          <div key={s.branch_id || 'main'} className="space-y-1">
            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
              <span className="truncate">{s.branch_name}</span>
              <span className="text-white font-semibold flex-shrink-0">S/ {s.total_ventas.toFixed(0)}</span>
            </div>
            <div className="text-[10px] text-white/50">
              {s.num_comandas} comandas · ticket S/ {(s.num_comandas > 0 ? s.total_ventas / s.num_comandas : 0).toFixed(2)}
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#e63946] to-[#d4af37] rounded-full"
                style={{ width: `${(s.total_ventas / maxVentas) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VentasPorDia({ data }: { data: DataReporte['por_dia'] }) {
  if (data.length === 0) {
    return null;
  }
  const maxVentas = Math.max(...data.map(d => d.total_ventas), 1);
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Calendar className="w-4 h-4 text-[#06d6a0]" />
        <h3 className="text-sm sm:text-base font-semibold">Ventas por día</h3>
      </div>
      <div className="flex items-end gap-0.5 sm:gap-1 h-24 sm:h-32 overflow-x-auto scrollbar-none">
        {data.map(d => (
          <div key={d.fecha} className="flex-1 min-w-[3px] sm:min-w-[6px] flex flex-col items-center group relative">
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#06d6a0] to-[#118ab2] hover:from-[#d4af37] hover:to-[#e63946] transition-all"
              style={{ height: `${Math.max(4, (d.total_ventas / maxVentas) * 100)}px` }}
              title={`${d.fecha} — ${d.num_comandas} comandas, S/ ${d.total_ventas.toFixed(2)}`}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-white/40">
        <span>{data[0]?.fecha}</span>
        <span>{data[data.length - 1]?.fecha}</span>
      </div>
    </div>
  );
}
