'use client';

import Link from 'next/link';
import {
  Eye,
  TrendingUp,
  BookOpen,
  Plus,
  Crown,
  BarChart3,
  ChefHat,
  ClipboardList,
  Package,
  UtensilsCrossed,
  Utensils,
  Globe,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type { Plan } from '@/lib/plans';
import { isPlanAtLeast, type PlanId } from '@/lib/plans';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { MozoInstallBanner } from '@/components/pwa/mozo-install-banner';

interface MenuStat {
  id: string;
  name: string;
  slug: string;
  views: number;
  isPublished: boolean;
}

interface Props {
  user: { email: string; name: string };
  plan: Plan;
  isSuperAdmin?: boolean;
  stats: {
    menusCount: number;
    publishedCount: number;
    totalViews: number;
    recentComandas: Array<{
      id: string;
      status: string;
      total: number;
      created_at: string;
      mesa_numero: number | null;
      items_count: number | null;
    }>;
    monthRevenue: number;
    monthComandasCount: number;
    topDishes: Array<{ name: string; qty: number; revenue: number }>;
    menus: MenuStat[];
  };
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 }).format(n || 0);

const formatNumber = (n: number) => new Intl.NumberFormat('es-PE').format(n || 0);

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'hace un momento';
  if (sec < 3600) return `hace ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `hace ${Math.floor(sec / 3600)} h`;
  if (sec < 604800) return `hace ${Math.floor(sec / 86400)} días`;
  return d.toLocaleDateString('es-PE');
}

export function DashboardHomeClient({ user, plan, isSuperAdmin = false, stats }: Props) {
  const isPremium = isPlanAtLeast(plan.id, 'premium' as PlanId);
  const isFull = isPlanAtLeast(plan.id, 'full' as PlanId);
  const isPro = isPlanAtLeast(plan.id, 'pro' as PlanId);

  const topMenu = stats.menus.slice().sort((a, b) => b.views - a.views)[0];

  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      {/* ───────── Header ───────── */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
            style={{
              background: `${plan.color}20`,
              color: plan.color,
              borderColor: `${plan.color}40`,
            }}
          >
            {plan.name}
          </span>
        </div>
        <p className="text-white/60 text-sm sm:text-base">
          Hola {user.name} 👋 — Resumen de tu actividad
        </p>
      </div>

      {/* ───────── KPIs principales ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <KPICard
          icon={<Eye className="w-5 h-5" />}
          label="Visitas totales"
          value={formatNumber(stats.totalViews)}
          accent="#d4af37"
          hint="Todos tus menús"
        />
        <KPICard
          icon={<BookOpen className="w-5 h-5" />}
          label="Menús"
          value={formatNumber(stats.menusCount)}
          accent="#ff6b35"
          hint={`${stats.publishedCount} publicados`}
        />
        {isPremium && (
          <KPICard
            icon={<ClipboardList className="w-5 h-5" />}
            label="Comandas (mes)"
            value={formatNumber(stats.monthComandasCount || stats.recentComandas.length)}
            accent="#06d6a0"
            hint="Últimos 30 días"
          />
        )}
        {isFull && (
          <KPICard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Ingresos (mes)"
            value={formatCurrency(stats.monthRevenue)}
            accent="#9d4edd"
            hint="Comandas confirmadas"
          />
        )}
        {!isPremium && (
          <KPICard
            icon={<Crown className="w-5 h-5" />}
            label="Plan actual"
            value={plan.name}
            accent={plan.color}
            hint="Premium desbloquea más"
          />
        )}
        {!isFull && isPremium && (
          <KPICard
            icon={<Sparkles className="w-5 h-5" />}
            label="Plan"
            value={plan.name}
            accent={plan.color}
            hint="Full → reportes + ingresos"
          />
        )}
      </div>

      {/* ───────── Plan Pro: solo analytics ───────── */}
      {plan.id === 'pro' && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-[#d4af37]" />
            <h2 className="font-semibold">Analíticas de tus menús</h2>
            <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-bold border border-[#d4af37]/40">
              <Crown className="w-3 h-3" /> PRO
            </span>
          </div>
          <p className="text-white/60 text-sm mb-4">
            Tu plan Pro incluye analíticas completas de visitas por menú. Sube a Premium para desbloquear comandas, cocina, mozos y reportes avanzados.
          </p>
          <div className="space-y-3">
            {stats.menus.length === 0 ? (
              <p className="text-white/50 text-center py-6 text-sm">
                Aún no tienes menús. <Link href="/dashboard/menus" className="text-[#d4af37] underline">Crea tu primer menú →</Link>
              </p>
            ) : (
              stats.menus
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map((m) => {
                  const maxViews = Math.max(...stats.menus.map(x => x.views), 1);
                  const pct = (m.views / maxViews) * 100;
                  return (
                    <div key={m.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm gap-2">
                        <span className="font-medium truncate">{m.name}</span>
                        <span className="text-[#d4af37] font-semibold flex-shrink-0">{formatNumber(m.views)} visitas</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          <div className="mt-5 flex flex-col sm:flex-row gap-2">
            <Link
              href="/dashboard/analytics"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition"
            >
              Ver analíticas completas <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/billing"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] text-sm font-semibold hover:opacity-90"
            >
              <Crown className="w-4 h-4" /> Subir a Premium
            </Link>
          </div>
        </div>
      )}

      {/* ───────── Plan Free: upsell + accesos rápidos ───────── */}
      {plan.id === 'free' && (
        <div className="bg-gradient-to-br from-[#d4af37]/10 to-transparent border border-[#d4af37]/30 rounded-2xl p-5 sm:p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold mb-1">Desbloquea el potencial completo</h2>
              <p className="text-white/60 text-sm">
                Estás en plan Free. Sube a Pro para ver analíticas detalladas, dominios personalizados y más.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
            {[
              { icon: BarChart3, label: 'Analíticas', plan: 'Pro' },
              { icon: ClipboardList, label: 'Comandas', plan: 'Premium' },
              { icon: ChefHat, label: 'Cocina + Mozos', plan: 'Premium' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10">
                <f.icon className="w-4 h-4 text-[#d4af37]" />
                <span className="text-sm flex-1">{f.label}</span>
                <span className="text-[10px] text-white/40">{f.plan}+</span>
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] text-sm font-semibold hover:opacity-90 w-full sm:w-auto"
          >
            <Crown className="w-4 h-4" /> Ver planes
          </Link>
        </div>
      )}

      {/* ───────── Premium+: comandas recientes + accesos operativos ───────── */}
      {isPremium && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Comandas recientes */}
          <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#06d6a0]" />
                Comandas recientes
              </h2>
              <Link href="/dashboard/comandas" className="text-xs text-white/60 hover:text-white">
                Ver todas →
              </Link>
            </div>
            {stats.recentComandas.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-10 h-10 text-white/20 mx-auto mb-2" />
                <p className="text-white/50 text-sm">Aún no hay comandas</p>
                <p className="text-white/40 text-xs mt-1">
                  Configura mesas y mozos para empezar a recibir pedidos
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentComandas.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c.status === 'pending' ? 'bg-amber-400' :
                      c.status === 'preparing' ? 'bg-blue-400' :
                      c.status === 'ready' ? 'bg-emerald-400' :
                      c.status === 'delivered' ? 'bg-white/40' :
                      'bg-red-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {c.mesa_numero ? `Mesa ${c.mesa_numero}` : 'Para llevar'}
                      </div>
                      <div className="text-xs text-white/50">
                        {timeAgo(c.created_at)} · {c.items_count || 0} ítems
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#06d6a0] flex-shrink-0">
                      {formatCurrency(c.total || 0)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accesos operativos rápidos */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
            <h2 className="font-semibold mb-4 text-sm sm:text-base">Operaciones</h2>
            <div className="grid grid-cols-2 gap-2">
              <QuickAccess href="/dashboard/mesas" icon={Utensils} label="Mesas" />
              <QuickAccess href="/dashboard/mozos" icon={UtensilsCrossed} label="Mozos" />
              <QuickAccess href="/dashboard/cocina" icon={ChefHat} label="Cocina" />
              <QuickAccess href="/dashboard/inventario" icon={Package} label="Inventario" />
              {isPro && <QuickAccess href="/dashboard/analytics" icon={BarChart3} label="Analíticas" />}
              {isPro && <QuickAccess href="/dashboard/domains" icon={Globe} label="Dominios" />}
            </div>
          </div>
        </div>
      )}

      {/* ───────── Full: top platos + ingresos ───────── */}
      {isFull && stats.topDishes.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#9d4edd]" />
            Top platos del mes
          </h2>
          <div className="space-y-3">
            {stats.topDishes.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  i === 0 ? 'bg-[#d4af37]/20 text-[#d4af37]' :
                  i === 1 ? 'bg-white/10 text-white/70' :
                  i === 2 ? 'bg-amber-700/30 text-amber-500' :
                  'bg-white/5 text-white/50'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-white/50">{formatNumber(d.qty)} pedidos</div>
                </div>
                <div className="text-sm font-semibold text-[#9d4edd] flex-shrink-0">
                  {formatCurrency(d.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────── Menú más visitado + CTA ───────── */}
      {topMenu && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            Tu menú estrella
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#ff6b35]/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{topMenu.name}</div>
              <div className="text-sm text-white/60">
                {formatNumber(topMenu.views)} visitas totales
                {topMenu.slug && (
                  <>
                    {' · '}
                    <a
                      href={`/r/${topMenu.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d4af37] hover:underline"
                    >
                      Ver carta →
                    </a>
                  </>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/menus"
              className="flex-shrink-0 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition"
            >
              Editar
            </Link>
          </div>
        </div>
      )}

      {/* ───────── CTA crear menú ───────── */}
      {stats.menusCount === 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ff6b35]/15 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#ff6b35]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Crea tu primer menú digital</h2>
          <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">
            En menos de 5 minutos tendrás tu carta con carrito de WhatsApp lista para compartir.
          </p>
          <Link
            href="/dashboard/menus"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff6b35] to-[#d4af37] text-white text-sm font-semibold hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Crear mi menú
          </Link>
        </div>
      )}

      {/* ───────── PWA banner para TODOS los planes ───────── */}
      <div className="mt-8 pt-6 border-t border-white/5">
        {/* Banner prominent solo si no está instalada (se oculta automáticamente al instalar) */}
        <MozoInstallBanner
          planId={plan.id}
          variant="dashboard"
        />
        {/* Botón compact como acceso rápido siempre visible (también se auto-oculta si instalada) */}
        <InstallAppButton
          variant="dashboard"
          size="sm"
          style="compact"
          planId={plan.id}
          className="w-full justify-center sm:w-auto"
        />
      </div>
    </DashboardShell>
  );
}

function KPICard({
  icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 text-white/50 text-xs sm:text-sm mb-2">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="text-xl sm:text-2xl font-bold truncate" style={{ color: accent }}>
        {value}
      </div>
      {hint && <div className="text-[10px] sm:text-xs text-white/40 mt-1">{hint}</div>}
    </div>
  );
}

function QuickAccess({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Utensils;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition group"
    >
      <Icon className="w-5 h-5 text-white/60 group-hover:text-[#d4af37] transition" />
      <span className="text-xs text-white/70">{label}</span>
    </Link>
  );
}
