'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChefHat, RefreshCw, AlertCircle, Clock, Check, X, Bell,
  Lock, Eye, EyeOff, ArrowRight, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Panel externo de COCINA: /cocina/{token}
 *
 * Misma arquitectura que /mozo/{token} pero optimizado para cocineros:
 *  - Solo muestra comandas activas (enviadas, en_preparacion, listas)
 *  - Permite marcar items como listos / pendientes
 *  - Permite avanzar el estado de la comanda (enviada → en_preparacion → lista → entregada)
 *  - Auto-refresh cada 15s
 *  - Validación opcional de contraseña (si el cocinero la tiene configurada)
 *
 * Usa el endpoint /api/mozo-panel?token=...&role=cocinero (compartido con mozos,
 * el endpoint valida el token contra waiters sin importar el rol).
 */

interface OrderItem {
  id: string; menu_item_name: string; menu_item_price: number;
  quantity: number; notes: string | null;
  status: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado' | 'cancelado';
  prepared_at: string | null;
}
interface Order {
  id: string; order_number: string; status: string;
  created_at: string; sent_at: string | null;
  table: { number: number; name: string | null } | null;
  waiter: { full_name: string } | null;
  items: OrderItem[];
  notes: string | null;
}

interface Props {
  token: string;
  staffName: string;
}

export function CocinaPanel({ token, staffName }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [mozoPassword, setMozoPassword] = useState<string | null>(null);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const load = useCallback(async () => {
    if (needsPassword) return;
    setError(null);
    try {
      const url = `/api/mozo-panel?token=${encodeURIComponent(token)}`;
      const res = await fetch(url, {
        headers: mozoPassword ? { 'x-mozo-password': mozoPassword } : undefined,
      });
      if (res.status === 401) {
        const d = await res.json().catch(() => ({}));
        if (d.requiresPassword) {
          setNeedsPassword(true);
          return;
        }
        throw new Error(d.error || 'Token inválido');
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error');
      }
      const d = await res.json();
      // Filtrar solo comandas activas para cocina
      const active = (d.comandas || []).filter((o: Order) =>
        ['enviada', 'en_preparacion', 'lista'].includes(o.status)
      );
      setOrders(active);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [token, mozoPassword, needsPassword]);

  useEffect(() => {
    // Restaurar contraseña de sessionStorage si existe
    try {
      const saved = sessionStorage.getItem(`menupro_mozo_pwd_${token}`);
      if (saved) setMozoPassword(saved);
    } catch {
      /* ignore */
    }
    load();
  }, [token, mozoPassword, load]);

  // Auto-refresh cada 15s
  useEffect(() => {
    if (!autoRefresh || needsPassword) return;
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, needsPassword, load]);

  // ─── Password gate ───
  if (needsPassword) {
    const submitPwd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pwdInput) return;
      setPwdSubmitting(true);
      setPwdError(null);
      try {
        const res = await fetch(`/api/mozo-panel?token=${encodeURIComponent(token)}`, {
          headers: { 'x-mozo-password': pwdInput },
        });
        if (res.status === 401) {
          const d = await res.json().catch(() => ({}));
          if (d.requiresPassword) {
            setPwdError('Contraseña incorrecta');
            return;
          }
          throw new Error(d.error || 'Error');
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Error');
        }
        setMozoPassword(pwdInput);
        try { sessionStorage.setItem(`menupro_mozo_pwd_${token}`, pwdInput); } catch {}
        setNeedsPassword(false);
        setPwdInput('');
      } catch (err: any) {
        setPwdError(err.message || 'Error');
      } finally {
        setPwdSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07070b] via-[#0a0a14] to-[#0f0a1a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#d4af37]/30">
              <Lock className="w-8 h-8 text-[#1a1a2e]" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Cocina protegida</h1>
            <p className="text-white/60 text-sm">
              Hola <span className="font-semibold text-white">{staffName}</span>, ingresa tu contraseña para acceder al panel de cocina.
            </p>
          </div>
          <form
            onSubmit={submitPwd}
            className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-3"
          >
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdInput}
                  onChange={(e) => setPwdInput(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-3 pr-11 text-white placeholder-white/30 focus:border-[#d4af37] focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50 transition"
                  autoFocus
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition"
                  aria-label={showPwd ? 'Ocultar' : 'Ver'}
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {pwdError && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={pwdSubmitting || !pwdInput}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pwdSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>Ingresar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
          <p className="text-center text-xs text-white/40 mt-4 leading-relaxed">
            ¿No tienes tu contraseña? Pídesela al administrador del restaurante.
          </p>
        </div>
      </div>
    );
  }

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-9 h-9 text-red-400" />
          </div>
          <h1 className="text-white text-xl font-bold mb-2">No se pudo cargar</h1>
          <p className="text-white/55 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 rounded-xl bg-[#d4af37] hover:bg-[#e5bf4f] text-[#1a1a2e] text-sm font-semibold transition"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Agrupar por estado
  const enviadas = orders.filter(o => o.status === 'enviada');
  const enPreparacion = orders.filter(o => o.status === 'en_preparacion');
  const listas = orders.filter(o => o.status === 'lista');

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 0) return 'ahora';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs < 24) return `${hrs}h ${remMins}m`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Ayer';
    if (days < 7) return `${days}d`;
    return 'Antiguo';
  }
  function getUrgency(sentAt: string | null, createdAt: string): 'normal' | 'warning' | 'critical' | 'stale' {
    const ref = sentAt || createdAt;
    const mins = (Date.now() - new Date(ref).getTime()) / 60000;
    if (mins > 1440) return 'stale';
    if (mins > 20) return 'critical';
    if (mins > 10) return 'warning';
    return 'normal';
  }

  async function updateItemStatus(orderId: string, itemId: string, status: OrderItem['status']) {
    try {
      const res = await fetch(`/api/comandas/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(mozoPassword ? { 'x-mozo-password': mozoPassword } : {}),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Error');
      }
      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, items: o.items.map(i => i.id === itemId ? { ...i, status, prepared_at: status === 'listo' ? new Date().toISOString() : i.prepared_at } : i) }
          : o
      ));
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  async function advanceOrderStatus(orderId: string, currentStatus: string) {
    const next: Record<string, string> = {
      'enviada': 'en_preparacion',
      'en_preparacion': 'lista',
      'lista': 'entregada',
    };
    const nextStatus = next[currentStatus];
    if (!nextStatus) return;
    try {
      const res = await fetch(`/api/comandas/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(mozoPassword ? { 'x-mozo-password': mozoPassword } : {}),
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Error');
      }
      toast.success(`Comanda → ${nextStatus}`);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a14] border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center flex-shrink-0">
              <ChefHat className="w-6 h-6 text-[#1a1a2e]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">{staffName} · Cocina</div>
              <div className="text-[10px] text-white/40">
                {orders.length} comandas activas · Auto-refresh cada 15s · Última: {lastRefresh.toLocaleTimeString('es-PE')}
              </div>
            </div>
          </div>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0 ${autoRefresh ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40' : 'bg-white/5 text-white/60 border border-white/10'}`}
          >
            {autoRefresh ? '⏸️ Auto ON' : '▶️ Auto OFF'}
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"
            aria-label="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Body — 3 columnas en desktop, stack en mobile */}
      {orders.length === 0 ? (
        <div className="text-center py-24">
          <ChefHat className="w-16 h-16 mx-auto text-white/20 mb-4" />
          <p className="text-white/60 text-lg font-semibold">No hay comandas activas</p>
          <p className="text-white/40 text-sm mt-2">Las nuevas comandas aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3">
          <Column
            title="📋 Por iniciar"
            count={enviadas.length}
            color="#118ab2"
            orders={enviadas}
            getUrgency={getUrgency}
            timeAgo={timeAgo}
            onAdvance={(id) => advanceOrderStatus(id, 'enviada')}
            onItemUpdate={updateItemStatus}
            advanceLabel="Iniciar preparación"
          />
          <Column
            title="🔥 En preparación"
            count={enPreparacion.length}
            color="#d4af37"
            orders={enPreparacion}
            getUrgency={getUrgency}
            timeAgo={timeAgo}
            onAdvance={(id) => advanceOrderStatus(id, 'en_preparacion')}
            onItemUpdate={updateItemStatus}
            advanceLabel="Marcar como lista"
          />
          <Column
            title="✅ Listas para entregar"
            count={listas.length}
            color="#06d6a0"
            orders={listas}
            getUrgency={getUrgency}
            timeAgo={timeAgo}
            onAdvance={(id) => advanceOrderStatus(id, 'lista')}
            onItemUpdate={updateItemStatus}
            advanceLabel="Entregar (liberar mesa)"
          />
        </div>
      )}
    </div>
  );
}

function Column({
  title, count, color, orders, getUrgency, timeAgo, onAdvance, onItemUpdate, advanceLabel,
}: {
  title: string; count: number; color: string;
  orders: Order[];
  getUrgency: (sentAt: string | null, createdAt: string) => 'normal' | 'warning' | 'critical' | 'stale';
  timeAgo: (dateStr: string) => string;
  onAdvance: (id: string) => void;
  onItemUpdate: (orderId: string, itemId: string, status: OrderItem['status']) => void;
  advanceLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-xl p-3 flex items-center justify-between sticky top-[80px] z-10 backdrop-blur"
        style={{ background: `${color}25`, border: `1px solid ${color}40` }}
      >
        <h3 className="font-semibold" style={{ color }}>{title}</h3>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ background: color, color: '#0a0a14' }}
        >
          {count}
        </span>
      </div>

      <div className="space-y-3">
        {orders.map(order => {
          const urgency = getUrgency(order.sent_at, order.created_at);
          const urgencyColor =
            urgency === 'critical' ? '#e63946'
            : urgency === 'warning' ? '#d4af37'
            : urgency === 'stale' ? '#6b7280'
            : color;
          const activeItems = order.items.filter(i => i.status !== 'cancelado' && i.status !== 'entregado');

          return (
            <div
              key={order.id}
              className={`rounded-2xl border-2 p-4 bg-[#0f0f1a] ${urgency === 'stale' ? 'opacity-60' : ''}`}
              style={{ borderColor: `${urgencyColor}60` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-lg font-bold">{order.order_number}</div>
                  {order.table && (
                    <div className="text-xs text-white/60">Mesa {order.table.number}</div>
                  )}
                  {order.waiter && (
                    <div className="text-[10px] text-white/40">Mozo: {order.waiter.full_name}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs" style={{ color: urgencyColor }}>
                    <Clock className="w-3 h-3" />
                    {timeAgo(order.sent_at || order.created_at)}
                  </div>
                  {urgency === 'critical' && (
                    <div className="text-[10px] text-red-400 font-bold mt-1">¡URGENTE!</div>
                  )}
                  {urgency === 'stale' && (
                    <div className="text-[10px] text-white/40 font-semibold mt-1">⏳ Antigua</div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {activeItems.map(item => (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                    <button
                      onClick={() => onItemUpdate(order.id, item.id, item.status === 'listo' ? 'pendiente' : 'listo')}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition ${
                        item.status === 'listo' ? 'bg-[#06d6a0] text-[#0a0a14]' : 'bg-white/10 hover:bg-white/20'
                      }`}
                      aria-label={item.status === 'listo' ? 'Marcar como pendiente' : 'Marcar como listo'}
                    >
                      {item.status === 'listo' && <Check className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${item.status === 'listo' ? 'line-through text-white/40' : ''}`}>
                        {item.quantity}x {item.menu_item_name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-amber-400 mt-0.5">↳ {item.notes}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {order.notes && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mb-3 text-xs text-amber-300">
                  <strong>Notas:</strong> {order.notes}
                </div>
              )}

              <button
                onClick={() => onAdvance(order.id)}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition active:scale-[0.98]"
                style={{ background: color, color: '#0a0a14' }}
              >
                {advanceLabel}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
