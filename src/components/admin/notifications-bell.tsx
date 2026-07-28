'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, X, Crown, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  level: 'info' | 'success' | 'warning' | 'error';
  read_at: string | null;
  target_admin_id: string | null;
  related_user_id: string | null;
  created_at: string;
}

/**
 * AdminNotificationsBell — campana de notificaciones para el panel super admin.
 *
 * Funcionalidades:
 * - Badge con contador de no leídas
 * - Polling cada 30s para detectar nuevas
 * - Toast inmediato cuando llega una nueva suscripción/pago
 * - Browser push notification (si el admin otorgó permiso)
 * - Dropdown con lista de notificaciones
 * - Marcar como leída (individual o todas)
 * - Pedir permiso de notificaciones del navegador al primer uso
 *
 * Requiere que el webhook de MercadoPago inserte en `admin_notifications`.
 */
export function AdminNotificationsBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastNotifIdRef = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (silent = true) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/admin/notifications?limit=20');
      if (!res.ok) return;
      const data = await res.json();
      const newNotifs: AdminNotification[] = data.notifications || [];
      const newUnread = data.unread_count || 0;

      // Detectar nuevas notificaciones desde el último fetch
      if (lastNotifIdRef.current && newNotifs.length > 0) {
        const newest = newNotifs[0];
        if (newest && newest.id !== lastNotifIdRef.current && newest.read_at === null) {
          // Es nueva y no leída — disparar toast + browser notification
          showToast(newest);
          showBrowserNotification(newest);
        }
      }
      // Actualizar ref del ID más reciente
      if (newNotifs.length > 0) {
        lastNotifIdRef.current = newNotifs[0].id;
      }

      setNotifications(newNotifs);
      setUnreadCount(newUnread);
    } catch (err) {
      // Silencioso en producción
      console.warn('[AdminNotif] fetch error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Polling cada 30s
  useEffect(() => {
    fetchNotifications(false);
    const interval = setInterval(() => fetchNotifications(true), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Pedir permiso de notificaciones del navegador (una sola vez, lazy al abrir)
  const ensureBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }, []);

  function showToast(n: AdminNotification) {
    if (n.level === 'success') {
      toast.success(n.title, { description: n.message, duration: 8000 });
    } else if (n.level === 'error') {
      toast.error(n.title, { description: n.message, duration: 8000 });
    } else {
      toast(n.title, { description: n.message, duration: 8000 });
    }
  }

  function showBrowserNotification(n: AdminNotification) {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      const notif = new Notification(n.title, {
        body: n.message,
        icon: '/logo-192.png',
        tag: n.id,
        badge: '/logo-192.png',
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
        setOpen(true);
      };
    } catch (err) {
      console.warn('[AdminNotif] browser notification error:', err);
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error('No se pudo marcar como leída');
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('Todas marcadas como leídas');
    } catch (err) {
      toast.error('No se pudo marcar todas como leídas');
    }
  }

  function getLevelIcon(level: string) {
    switch (level) {
      case 'success':
        return <Crown className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
    }
  }

  function formatRelativeTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return 'hace un momento';
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    const days = Math.floor(hr / 24);
    if (days < 7) return `hace ${days}d`;
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  async function handleBellClick() {
    if (!open && unreadCount === 0 && notifications.length === 0) {
      // Primera apertura — pedir permiso de notificaciones
      await ensureBrowserPermission();
    }
    setOpen((v) => !v);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative w-11 h-11 sm:w-10 sm:h-10 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        title="Notificaciones"
      >
        <Bell className="w-5 h-5 text-white/70" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0a0a14] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 sm:top-11 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-[#0f0f1a] border border-white/15 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-sm">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-white/60 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition"
                  title="Marcar todas como leídas"
                >
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-white/50 hover:text-white p-1 rounded hover:bg-white/5"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-sm">Cargando…</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">No hay notificaciones</p>
                <p className="text-white/30 text-xs mt-1">
                  Las nuevas suscripciones y pagos aparecerán aquí.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {notifications.map((n) => {
                  const isUnread = !n.read_at;
                  return (
                    <li
                      key={n.id}
                      className={`p-3 hover:bg-white/[0.03] transition cursor-pointer ${
                        isUnread ? 'bg-amber-500/[0.04]' : ''
                      }`}
                      onClick={() => {
                        if (isUnread) markAsRead(n.id);
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getLevelIcon(n.level)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <div className="font-semibold text-sm text-white/95 leading-tight">
                              {n.title}
                            </div>
                            {isUnread && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-white/40">
                              {formatRelativeTime(n.created_at)}
                            </span>
                            {isUnread && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                className="text-[10px] text-white/50 hover:text-white flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Marcar leída
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-white/10 bg-white/[0.02]">
            <p className="text-[10px] text-white/40 text-center">
              Las notificaciones se actualizan cada 30s · Solicita permiso del navegador para alertas push
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
