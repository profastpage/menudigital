'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LogOut,
  Users,
  LayoutDashboard,
  Globe,
  Crown,
  Shield,
  Trash2,
  Search,
  Loader2,
  Eye,
  Menu as MenuIcon,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  UserCog,
  Ban,
  UserCheck,
  DollarSign,
  Activity,
  AlertTriangle,
  X,
  ExternalLink,
  ImageIcon,
  Phone,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface AdminInfo {
  email: string;
  name: string;
  avatar_url: string | null;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  is_super_admin: boolean;
  is_active: boolean;
  banned_at: string | null;
  banned_reason: string | null;
  mp_status: string | null;
  mp_preapproval_id: string | null;
  current_period_end: string | null;
  bg_removals_used: number;
  bg_removals_reset_at: string;
  created_at: string;
  updated_at: string;
  menus_count: number;
  views_total: number;
  published_menus: number;
  dishes_count: number;
}

interface Stats {
  total_users: number;
  active_users: number;
  banned_users: number;
  pro_users: number;
  free_users: number;
  super_admins: number;
  total_menus: number;
  published_menus: number;
  total_categories: number;
  total_dishes: number;
  total_views: number;
  total_domains: number;
  verified_domains: number;
  recent_signups_7d: number;
  recent_signups_30d: number;
  revenue_estimate_pen: number;
  revenue_estimate_usd: number;
  top_menus_by_views: Array<{
    id: string;
    name: string;
    slug: string;
    views_count: number;
    owner_email: string;
    owner_name: string | null;
  }>;
}

interface UserDetail {
  profile: UserRow;
  menus: Array<any>;
  domains: Array<any>;
  recent_views: Array<any>;
}

type Tab = 'stats' | 'users' | 'domains';

export function SuperAdminClient({ admin }: { admin: AdminInfo }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ tab: activeTab });
      if (activeTab === 'users') {
        params.set('search', search);
        params.set('page', String(page));
      }
      const res = await fetch(`/api/admin?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      if (activeTab === 'stats') {
        setStats(data.stats);
      } else if (activeTab === 'users') {
        setUsers(data.users || []);
        setTotalPages(Math.ceil((data.total || 0) / 20));
      } else if (activeTab === 'domains') {
        setDomains(data.domains || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAction(action: string, userId: string, extra?: Record<string, any>) {
    setActionLoading(`${action}-${userId}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      if (action === 'toggle_plan') {
        toast.success(`Plan cambiado a ${data.newPlan}`);
      } else if (action === 'toggle_super_admin') {
        toast.success(`Super admin: ${data.is_super_admin ? 'activado' : 'desactivado'}`);
      } else if (action === 'toggle_active') {
        toast.success(data.is_active ? 'Usuario reactivado' : 'Usuario desactivado');
      } else {
        toast.success('Acción completada');
      }
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleViewUserDetail(userId: string) {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await fetch(`/api/admin?tab=user_detail&userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setUserDetail(data.detail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, email: string) {
    if (!confirm(`¿Eliminar usuario ${email} y TODOS sus menús, categorías, platos, dominios y vistas? Esta acción es IRREVERSIBLE.`)) return;
    await handleAction('delete_user', userId);
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      router.push('/login');
    }
  }

  const statCards = stats
    ? [
        { label: 'Total usuarios', value: stats.total_users, icon: Users, color: '#d4af37', sub: `${stats.active_users} activos · ${stats.banned_users} baneados` },
        { label: 'Usuarios Pro', value: stats.pro_users, icon: Crown, color: '#22c55e', sub: `${stats.free_users} gratis` },
        { label: 'Registros 7 días', value: stats.recent_signups_7d, icon: TrendingUp, color: '#3b82f6', sub: `${stats.recent_signups_30d} en 30 días` },
        { label: 'Total menús', value: stats.total_menus, icon: MenuIcon, color: '#f97316', sub: `${stats.published_menus} publicados` },
        { label: 'Total platos', value: stats.total_dishes, icon: Hash, color: '#a855f7', sub: `${stats.total_categories} categorías` },
        { label: 'Vistas totales', value: stats.total_views, icon: Eye, color: '#ec4899', sub: 'Acumulado global' },
        { label: 'Dominios', value: `${stats.verified_domains}/${stats.total_domains}`, icon: Globe, color: '#14b8a6', sub: 'verificados/total' },
        { label: 'Super admins', value: stats.super_admins, icon: Shield, color: '#ef4444', sub: 'con acceso total' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#050507] text-white">
      {/* TOP NAV — Distinto al dashboard normal */}
      <header className="border-b border-amber-500/20 bg-gradient-to-r from-[#0a0a14] via-[#0f0a1a] to-[#0a0a14] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight flex items-center gap-2">
                MenuPro · Super Admin
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                  MODO DIOS
                </span>
              </div>
              <div className="text-xs text-white/40 leading-tight">Panel interno · Solo administración</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              {admin.avatar_url ? (
                <img src={admin.avatar_url} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-black">
                  {admin.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white/70 hidden md:inline">{admin.email}</span>
            </div>
            <a
              href="/dashboard"
              className="text-xs text-white/40 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition"
              title="Ir al dashboard de usuario normal"
            >
              Ver dashboard
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="border-b border-white/10 bg-[#070710]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {([
            { key: 'stats' as Tab, label: 'Estadísticas', icon: LayoutDashboard },
            { key: 'users' as Tab, label: 'Usuarios', icon: Users },
            { key: 'domains' as Tab, label: 'Dominios', icon: Globe },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* STATS TAB */}
        {activeTab === 'stats' && (
          loading && !stats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : stats ? (
            <>
              {/* Top stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((card) => (
                  <div
                    key={card.label}
                    className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <card.icon className="w-4 h-4" style={{ color: card.color }} />
                      <span className="text-xs text-white/50">{card.label}</span>
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-[10px] text-white/30 mt-1">{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* Revenue block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    Ingresos estimados
                  </h3>
                  <div className="text-4xl font-bold text-amber-400">
                    S/ {stats.revenue_estimate_pen}
                    <span className="text-base text-white/40 ml-2">
                      ≈ ${stats.revenue_estimate_usd} USD
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    {stats.pro_users} suscriptores Pro × S/35/mes
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    Actividad reciente
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Registros esta semana</span>
                      <span className="font-bold text-emerald-400">{stats.recent_signups_7d}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Registros este mes</span>
                      <span className="font-bold text-emerald-400">{stats.recent_signups_30d}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60 text-sm">Vistas totales</span>
                      <span className="font-bold text-emerald-400">{stats.total_views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top menus by views */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  Top 10 menús más vistos
                </h3>
                {stats.top_menus_by_views && stats.top_menus_by_views.length > 0 ? (
                  <div className="space-y-2">
                    {stats.top_menus_by_views.map((m, idx) => (
                      <div key={m.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-500/30 text-amber-300' :
                            idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                            idx === 2 ? 'bg-orange-700/30 text-orange-300' :
                            'bg-white/5 text-white/40'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-medium text-sm">{m.name}</div>
                            <div className="text-xs text-white/40">{m.owner_email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-white/40 hidden md:inline">/{m.slug}</span>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                            {m.views_count.toLocaleString()} vistas
                          </span>
                          <a
                            href={`/m/${m.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-white/40 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 text-center py-6">No hay datos aún</p>
                )}
              </div>
            </>
          ) : null
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar por email o nombre..."
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="text-white/60"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <span className="text-sm text-white/40 ml-auto">
                {users.length} usuario{users.length !== 1 ? 's' : ''} · página {page}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin usuarios</h3>
                <p className="text-white/50">No se encontraron usuarios con ese criterio.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`bg-white/[0.03] border rounded-xl overflow-hidden transition-colors ${
                        u.is_active === false
                          ? 'border-red-500/40 bg-red-500/[0.03]'
                          : 'border-white/10'
                      }`}
                    >
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02]"
                        onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            u.is_super_admin
                              ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black'
                              : u.avatar_url
                              ? ''
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              (u.full_name || u.email)[0].toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate flex items-center gap-2">
                              {u.full_name || 'Sin nombre'}
                              {u.is_super_admin && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                                  SUPER ADMIN
                                </span>
                              )}
                              {u.is_active === false && (
                                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30">
                                  BANEADO
                                </span>
                              )}
                              {u.plan === 'pro' && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                  PRO
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/50 truncate">{u.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                          <span className="hidden md:inline text-white/40">
                            <strong className="text-white/70">{u.menus_count}</strong> menús
                          </span>
                          <span className="hidden md:inline text-white/40">
                            <strong className="text-white/70">{u.views_total}</strong> vistas
                          </span>
                          <span className="text-white/30">
                            {new Date(u.created_at).toLocaleDateString('es-PE')}
                          </span>
                        </div>
                      </div>

                      {expandedUser === u.id && (
                        <div className="border-t border-white/10 p-4 bg-white/[0.02]">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                            <div>
                              <div className="text-white/40 text-xs">Plan</div>
                              <div className="font-medium">{u.plan}</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">Menús</div>
                              <div className="font-medium">{u.menus_count} ({u.published_menus} publicados)</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">Platos</div>
                              <div className="font-medium">{u.dishes_count}</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">Vistas totales</div>
                              <div className="font-medium">{u.views_total}</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">MP Status</div>
                              <div className="font-medium">{u.mp_status || '—'}</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">BG removals</div>
                              <div className="font-medium">{u.bg_removals_used} usados</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">Registro</div>
                              <div className="font-medium">{new Date(u.created_at).toLocaleDateString('es-PE')}</div>
                            </div>
                            <div>
                              <div className="text-white/40 text-xs">Última actualización</div>
                              <div className="font-medium">{new Date(u.updated_at).toLocaleDateString('es-PE')}</div>
                            </div>
                            {u.banned_at && (
                              <div className="col-span-2 md:col-span-4 text-red-400 text-xs">
                                Baneado el {new Date(u.banned_at).toLocaleString('es-PE')}
                                {u.banned_reason ? ` — ${u.banned_reason}` : ''}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewUserDetail(u.id)}
                              className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              Ver detalle completo
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction('toggle_plan', u.id)}
                              disabled={actionLoading === `toggle_plan-${u.id}`}
                              className={`border-amber-500/40 text-amber-400 hover:bg-amber-500/10 ${
                                u.plan === 'pro' ? 'bg-amber-500/10' : ''
                              }`}
                            >
                              {actionLoading === `toggle_plan-${u.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <Crown className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              {u.plan === 'pro' ? 'Quitar Pro' : 'Dar Pro'}
                            </Button>
                            {!u.is_super_admin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('toggle_super_admin', u.id)}
                                disabled={actionLoading === `toggle_super_admin-${u.id}`}
                                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                              >
                                {actionLoading === `toggle_super_admin-${u.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <UserCog className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Dar Super Admin
                              </Button>
                            )}
                            {!u.is_super_admin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction('toggle_active', u.id, u.is_active === false ? undefined : { reason: 'Desactivado por admin' })}
                                disabled={actionLoading === `toggle_active-${u.id}`}
                                className={`${
                                  u.is_active === false
                                    ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-orange-500/40 text-orange-400 hover:bg-orange-500/10'
                                }`}
                              >
                                {actionLoading === `toggle_active-${u.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : u.is_active === false ? (
                                  <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                                ) : (
                                  <Ban className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                {u.is_active === false ? 'Reactivar' : 'Desactivar (ban)'}
                              </Button>
                            )}
                            {!u.is_super_admin && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={actionLoading === `delete_user-${u.id}`}
                                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                              >
                                {actionLoading === `delete_user-${u.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Eliminar
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="text-white/60">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-white/50">Página {page} de {totalPages}</span>
                    <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="text-white/60">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* DOMAINS TAB */}
        {activeTab === 'domains' && (
          loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-16">
              <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sin dominios personalizados</h3>
              <p className="text-white/50">Ningún usuario ha configurado dominios aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white/[0.03] border border-white/10 rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-white/50 text-xs">
                    <th className="p-4">Dominio</th>
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Menú</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">SSL</th>
                    <th className="p-4">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((d) => (
                    <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="p-4 font-medium">{d.domain}</td>
                      <td className="p-4">
                        <div>{d.profiles?.full_name || '—'}</div>
                        <div className="text-xs text-white/40">{d.profiles?.email}</div>
                      </td>
                      <td className="p-4">{d.menus?.name || '—'}</td>
                      <td className="p-4">
                        {d.is_verified ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verificado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-400 text-xs">
                            <XCircle className="w-3.5 h-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          d.ssl_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          d.ssl_status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-white/5 text-white/60'
                        }`}>
                          {d.ssl_status}
                        </span>
                      </td>
                      <td className="p-4 text-white/50">{new Date(d.created_at).toLocaleDateString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </main>

      {/* USER DETAIL MODAL */}
      {detailModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDetailModalOpen(false)}
        >
          <div
            className="bg-[#0a0a14] border border-amber-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#0a0a14] border-b border-white/10 p-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                Detalle completo del usuario
              </h2>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-white/40 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {detailLoading || !userDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
              ) : (
                <>
                  {/* Profile */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-bold text-black">
                        {userDetail.profile.full_name?.[0]?.toUpperCase() ||
                          userDetail.profile.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-base">
                          {userDetail.profile.full_name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-white/60">{userDetail.profile.email}</div>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            userDetail.profile.plan === 'pro'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-white/10 text-white/60'
                          }`}>
                            {userDetail.profile.plan?.toUpperCase()}
                          </span>
                          {userDetail.profile.is_super_admin && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-white/40 text-xs">ID</div>
                        <div className="font-mono text-xs">{userDetail.profile.id.slice(0, 8)}...</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs">Registro</div>
                        <div>{new Date(userDetail.profile.created_at).toLocaleString('es-PE')}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs">MP Status</div>
                        <div>{userDetail.profile.mp_status || '—'}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs">BG removals</div>
                        <div>{userDetail.profile.bg_removals_used}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs">Plan renovación</div>
                        <div>{userDetail.profile.current_period_end
                          ? new Date(userDetail.profile.current_period_end).toLocaleDateString('es-PE')
                          : '—'}</div>
                      </div>
                      <div>
                        <div className="text-white/40 text-xs">Estado</div>
                        <div>{userDetail.profile.is_active === false ? '🔴 Baneado' : '🟢 Activo'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Menus */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 mb-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MenuIcon className="w-4 h-4 text-amber-400" />
                      Menús ({userDetail.menus.length})
                    </h3>
                    {userDetail.menus.length === 0 ? (
                      <p className="text-sm text-white/40 py-3">Sin menús</p>
                    ) : (
                      <div className="space-y-3">
                        {userDetail.menus.map((m: any) => (
                          <div key={m.id} className="bg-white/[0.02] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <div className="font-medium text-sm flex items-center gap-2">
                                  {m.name}
                                  {m.is_published ? (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">PUBLICADO</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/40 text-[10px] font-bold">BORRADOR</span>
                                  )}
                                </div>
                                <div className="text-xs text-white/40">/{m.slug}</div>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-bold">
                                  {m.views_count} vistas
                                </span>
                                <a
                                  href={`/m/${m.slug}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-white/40 hover:text-white"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                            {m.color && (
                              <div className="flex items-center gap-2 text-xs text-white/50 mb-2">
                                <span>Color:</span>
                                <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: m.color }} />
                                <span className="font-mono">{m.color}</span>
                                <span className="ml-3">Moneda: {m.currency}</span>
                                {m.whatsapp && (
                                  <span className="ml-3 flex items-center gap-1">
                                    <Phone className="w-3 h-3" /> {m.whatsapp}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-xs text-white/40">
                              {m.categories.length} categorías · {m.categories.reduce((sum: number, c: any) => sum + c.dishes.length, 0)} platos
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent views */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      Últimas 50 vistas
                    </h3>
                    {userDetail.recent_views.length === 0 ? (
                      <p className="text-sm text-white/40 py-3">Sin vistas registradas</p>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {userDetail.recent_views.map((v: any) => (
                          <div key={v.id} className="flex items-center justify-between text-xs bg-white/[0.02] rounded px-3 py-2">
                            <div className="flex items-center gap-3">
                              <span className="text-white/60">{v.menu_name}</span>
                              <span className="text-white/40 font-mono">{v.ip || '—'}</span>
                            </div>
                            <span className="text-white/40">{new Date(v.created_at).toLocaleString('es-PE')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
