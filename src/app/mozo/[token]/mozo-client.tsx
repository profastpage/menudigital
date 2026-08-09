'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {  ClipboardList, Send, Check, X, Plus, Minus, Search,
  RefreshCw, AlertCircle, Utensils, ChefHat, Clock, User,
  WifiOff, CloudUpload, Loader2,
  Lock, Eye, EyeOff, ArrowRight, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOfflineQueue } from '@/hooks/use-offline-queue';
import { InstallAppButton } from '@/components/pwa/install-app-button';
import { MozoInstallBanner } from '@/components/pwa/mozo-install-banner';
import { MozoTutorialButton, MozoTutorial } from '@/components/pwa/mozo-tutorial';
import { type PlanId } from '@/lib/plans';
import { deriveVariantUrl } from '@/lib/image-utils';

interface Dish {
  id: string; name: string; price: number; description?: string; image_url?: string;
}
interface Category {
  id: string; name: string; dishes: Dish[];
}
interface Menu {
  id: string; name: string; slug: string;
  categories: Category[];
}
interface Mesa {
  id: string; number: number; name: string | null;
  status: 'libre' | 'ocupada' | 'reservada' | 'inactiva';
  capacity: number; location: string | null;
}
interface Comanda {
  id: string; order_number: string; status: string; total: number;
  currency: string; created_at: string; notes: string | null;
  table: { id: string; number: number; name: string | null } | null;
  items: {
    id: string; menu_item_name: string; quantity: number;
    menu_item_price: number; notes: string | null; status: string;
  }[];
}

interface Props {
  token: string;
  waiterName: string;
}

type View = 'mesas' | 'menu' | 'comandas';

export function MozoPanel({ token, waiterName }: Props) {
  const [view, setView] = useState<View>('mesas');
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [planId, setPlanId] = useState<PlanId | undefined>(undefined);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // ─── Password gate state ─────────────────────────────────
  // Si el mozo tiene contraseña configurada, el API devuelve 401 con
  // requiresPassword:true. Mostramos un formulario para ingresarla.
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSubmitting, setPwdSubmitting] = useState(false);
  // La contraseña validada se guarda en memoria (y sessionStorage) para
  // no volver a pedirla en cada auto-refresh.
  const [mozoPassword, setMozoPassword] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(`menupro_mozo_pwd_${token}`);
    } catch {
      return null;
    }
  });

  // Hook de cola offline (Premium+) — guarda comandas en IndexedDB cuando no hay red
  const { pending, isSyncing, enqueue, syncNow, hasPending } = useOfflineQueue(token);

  // Auto-abrir tutorial la primera vez que el mozo entra al panel
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SEEN_KEY = `menupro_mozo_tutorial_seen_${token}`;
    const seen = localStorage.getItem(SEEN_KEY);
    if (!seen) {
      // Pequeño delay para que cargue el panel primero
      const t = setTimeout(() => {
        setTutorialOpen(true);
        localStorage.setItem(SEEN_KEY, '1');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [token]);

  // Carrito para crear comanda
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [cart, setCart] = useState<{ dish: Dish; quantity: number; notes: string }[]>([]);
  const [searchDish, setSearchDish] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [cartExpanded, setCartExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (mozoPassword) headers['x-mozo-password'] = mozoPassword;
      const res = await fetch(`/api/mozo-panel?token=${encodeURIComponent(token)}`, { headers });
      if (res.status === 401) {
        const d = await res.json().catch(() => ({}));
        if (d.requiresPassword) {
          setNeedsPassword(true);
          setLoading(false);
          return;
        }
        throw new Error(d.error || 'No autorizado');
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error cargando datos');
      }
      const d = await res.json();
      setNeedsPassword(false);
      setMesas(d.mesas || []);
      setMenu(d.menu || null);
      setComandas(d.comandas || []);
      if (d.plan?.id) {
        setPlanId(d.plan.id as PlanId);
      }
      if (d.menu?.categories?.length) {
        setActiveCategory(d.menu.categories[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, mozoPassword]);

  useEffect(() => {
    load();
    // Auto-refresh cada 20s para ver comandas activas (solo si estamos online)
    const i = setInterval(() => {
      if (navigator.onLine) load();
    }, 20000);
    return () => clearInterval(i);
  }, [load]);

  // Detectar online/offline
  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener('online', () => {
      setIsOnline(true);
      toast.success('🌐 Conexión restablecida');
    });
    window.addEventListener('offline', () => {
      setIsOnline(false);
      toast.warning('📡 Sin conexión — comandas se guardarán offline');
    });
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  function addToCart(dish: Dish) {
    setCart(prev => {
      const existing = prev.find(i => i.dish.id === dish.id && !i.notes);
      if (existing) {
        return prev.map(i =>
          i.dish.id === dish.id && !i.notes ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { dish, quantity: 1, notes: '' }];
    });
    toast.success(`${dish.name} agregado`, { duration: 1200 });
  }

  function updateQty(idx: number, delta: number) {
    setCart(prev => prev.map((item, i) =>
      i === idx ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  }

  function removeItem(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx));
  }

  const cartTotal = useMemo(() =>
    cart.reduce((s, i) => s + i.dish.price * i.quantity, 0),
    [cart]
  );

  async function sendComanda() {
    if (!selectedMesa) {
      toast.error('Selecciona una mesa');
      return;
    }
    if (cart.length === 0) {
      toast.error('Agrega al menos un plato');
      return;
    }
    setSending(true);

    // ─── MODO OFFLINE (Premium+) ───
    // Si no hay conexión, guardar en cola IndexedDB y enviar cuando vuelva internet
    if (!navigator.onLine) {
      try {
        const offline = await enqueue({
          mesaId: selectedMesa.id,
          mesaNumero: selectedMesa.name || `Mesa ${selectedMesa.number}`,
          items: cart.map(c => ({
            dish_id: c.dish.id,
            nombre: c.dish.name,
            precio: c.dish.price,
            cantidad: c.quantity,
            notas: c.notes || undefined,
          })),
          notas: orderNotes || undefined,
          cliente: customerName || undefined,
        });
        toast.success(
          `📤 Comanda guardada offline (se enviará al volver la conexión)`,
          { duration: 4000 }
        );
        // Reset
        setCart([]);
        setCartExpanded(false);
        setSelectedMesa(null);
        setCustomerName('');
        setPartySize('');
        setOrderNotes('');
        setView('comandas');
      } catch (err: any) {
        toast.error(`Error guardando offline: ${err.message}`);
      } finally {
        setSending(false);
      }
      return;
    }

    // ─── MODO ONLINE (normal) ───
    try {
      const res = await fetch('/api/mozo-panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(mozoPassword ? { 'x-mozo-password': mozoPassword } : {}),
        },
        body: JSON.stringify({
          token,
          table_id: selectedMesa.id,
          items: cart.map(c => ({
            menu_item_id: c.dish.id,
            menu_item_name: c.dish.name,
            menu_item_price: c.dish.price,
            quantity: c.quantity,
            notes: c.notes || undefined,
          })),
          customer_name: customerName || undefined,
          party_size: partySize ? Number(partySize) : undefined,
          notes: orderNotes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error enviando comanda');
      }
      const d = await res.json();
      toast.success(`Comanda ${d.order_number} enviada a cocina`);
      // Reset
      setCart([]);
      setCartExpanded(false);
      setSelectedMesa(null);
      setCustomerName('');
      setPartySize('');
      setOrderNotes('');
      setView('comandas');
      await load();
    } catch (err: any) {
      // Si falla la red a mitad del envío, guardar en cola offline como safety net
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        try {
          await enqueue({
            mesaId: selectedMesa.id,
            mesaNumero: selectedMesa.name || `Mesa ${selectedMesa.number}`,
            items: cart.map(c => ({
              dish_id: c.dish.id,
              nombre: c.dish.name,
              precio: c.dish.price,
              cantidad: c.quantity,
              notas: c.notes || undefined,
            })),
            notas: orderNotes || undefined,
            cliente: customerName || undefined,
          });
          toast.success('📤 Sin red — comanda guardada para envío automático');
          setCart([]);
          setCartExpanded(false);
          setSelectedMesa(null);
          setView('comandas');
        } catch {
          toast.error(err.message);
        }
      } else {
        toast.error(err.message);
      }
    } finally {
      setSending(false);
    }
  }

  async function patchComanda(orderId: string, action: 'marcar_entregada' | 'cancelar') {
    try {
      const res = await fetch('/api/mozo-panel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(mozoPassword ? { 'x-mozo-password': mozoPassword } : {}),
        },
        body: JSON.stringify({ token, order_id: orderId, action }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error');
      }
      toast.success(action === 'marcar_entregada' ? 'Comanda marcada como entregada' : 'Comanda cancelada');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ───── Loading ─────
  if (loading && mesas.length === 0 && !needsPassword) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  // ───── Password gate ─────
  if (needsPassword) {
    const submitPwd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pwdInput) return;
      setPwdSubmitting(true);
      setPwdError(null);
      try {
        // Hacemos un fetch de prueba para validar la contraseña antes de guardarla.
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
        // Contraseña válida — guardarla y disparar reload
        setMozoPassword(pwdInput);
        try {
          sessionStorage.setItem(`menupro_mozo_pwd_${token}`, pwdInput);
        } catch {
          /* ignore */
        }
        setNeedsPassword(false);
        setPwdInput('');
        // El useEffect de load() se disparará porque mozoPassword cambió
      } catch (err: any) {
        setPwdError(err.message || 'Error');
      } finally {
        setPwdSubmitting(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07070b] via-[#0a0a14] to-[#0f0a1a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo + título */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9d4edd] to-[#c77dff] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#9d4edd]/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Panel protegido</h1>
            <p className="text-white/60 text-sm">
              Hola <span className="font-semibold text-white">{waiterName}</span>, ingresa tu contraseña para acceder a tu panel de mozo.
            </p>
          </div>

          {/* Formulario */}
          <form
            onSubmit={submitPwd}
            className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-3"
          >
            <div>
              <label className="text-xs text-white/50 font-medium mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwdInput}
                  onChange={(e) => setPwdInput(e.target.value)}
                  placeholder="Tu contraseña"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-3 pr-11 text-white placeholder-white/30 focus:border-[#9d4edd] focus:outline-none focus:ring-1 focus:ring-[#9d4edd]/50 transition"
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
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#9d4edd] to-[#c77dff] text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pwdSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
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

  if (error) {
    const isInvalidToken = /inválido|invalid|not found|no encontrado/i.test(error);
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-9 h-9 text-red-400" />
          </div>
          <h1 className="text-white text-xl font-bold mb-2">
            {isInvalidToken ? 'Enlace inválido' : 'No se pudo cargar'}
          </h1>
          <p className="text-white/55 text-sm mb-6 leading-relaxed">
            {isInvalidToken
              ? 'Este enlace de mozo ya no es válido o fue regenerado. Solicita un enlace nuevo a tu administrador.'
              : error}
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 rounded-xl bg-[#9d4edd] hover:bg-[#7b2cbf] text-white text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <a
              href="/"
              className="w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              Ir al inicio
            </a>
          </div>
          <p className="text-white/30 text-[11px] mt-6">
            Si crees que es un error, contacta al administrador del restaurante.
          </p>
        </div>
      </div>
    );
  }

  // ───── Layout móvil ─────
  return (
    <div className="min-h-screen bg-[#07070b] text-white pb-24">
      {/* Banner Offline (solo si está offline) — sticky para no chocar con header */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-amber-600 text-white px-3 py-2 text-xs font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo offline activo — las comandas se enviarán al volver la conexión</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a14] border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-[#9d4edd] to-[#d4af37] flex items-center justify-center text-lg flex-shrink-0">
              👨‍🍳
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate flex items-center gap-1.5">
                {waiterName}
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#06d6a0]' : 'bg-amber-500'}`} />
              </div>
              <div className="text-[10px] text-white/40">
                {isOnline ? 'Panel del mozo · En línea' : 'Panel del mozo · Offline'}
              </div>
            </div>
          </div>
          <MozoTutorialButton
            waiterName={waiterName}
            planId={planId}
            size="sm"
          />
          <button
            onClick={load}
            disabled={loading}
            className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0"
            aria-label="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <InstallAppButton
            variant="mozo"
            size="sm"
            style="compact"
            showLabel={false}
            planId={planId}
          />
        </div>
      </header>

      {/* Banner prominent de instalación de la app — solo si no está instalada */}
      <MozoInstallBanner
        planId={planId}
        waiterName={waiterName}
        variant="mozo"
      />

      {/* Banner de cola offline pendiente */}
      {hasPending && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CloudUpload className={`w-4 h-4 text-amber-400 flex-shrink-0 ${isSyncing ? 'animate-pulse' : ''}`} />
            <div className="min-w-0">
              <div className="text-xs text-amber-200 font-medium">
                {pending.length} comanda(s) en cola offline
              </div>
              <div className="text-[10px] text-amber-200/60 truncate">
                {isSyncing ? 'Sincronizando...' : isOnline ? 'Toca para reintentar' : 'Esperando conexión'}
              </div>
            </div>
          </div>
          {isOnline && !isSyncing && (
            <button
              onClick={() => syncNow()}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-semibold whitespace-nowrap"
            >
              Enviar ahora
            </button>
          )}
          {isSyncing && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
        </div>
      )}

      {/* Tabs superiores */}
      <div className="sticky top-[60px] z-20 bg-[#0a0a14] border-b border-white/5">
        <div className="grid grid-cols-3 px-2 py-2 gap-1.5">
          <TabBtn active={view === 'mesas'} onClick={() => setView('mesas')} icon={<Utensils className="w-4 h-4" />}>
            Mesas
          </TabBtn>
          <TabBtn active={view === 'menu'} onClick={() => setView('menu')} icon={<ClipboardList className="w-4 h-4" />}>
            Menú
          </TabBtn>
          <TabBtn active={view === 'comandas'} onClick={() => setView('comandas')} icon={<Send className="w-4 h-4" />}>
            Comandas
            {comandas.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#9d4edd] text-white text-[9px] font-bold">
                {comandas.length}
              </span>
            )}
            {pending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-bold">
                {pending.length}↑
              </span>
            )}
          </TabBtn>
        </div>
      </div>

      {/* ───── Vista: Mesas ───── */}
      {view === 'mesas' && (
        <div className="p-3 space-y-3">
          <p className="text-xs text-white/50">Selecciona una mesa para empezar una comanda</p>
          <div className="grid grid-cols-3 gap-2">
            {mesas.map(m => {
              const isSelected = selectedMesa?.id === m.id;
              const isFree = m.status === 'libre';
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMesa(m);
                    setView('menu');
                    toast.success(`Mesa ${m.number} seleccionada`);
                  }}
                  className={`relative p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-[#9d4edd] bg-[#9d4edd]/30'
                      : isFree
                      ? 'border-white/10 bg-[#15151f] hover:border-[#06d6a0]/50'
                      : 'border-white/10 bg-[#15151f] hover:border-[#d4af37]/50'
                  }`}
                >
                  <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    m.status === 'libre' ? 'bg-[#06d6a0]' :
                    m.status === 'ocupada' ? 'bg-[#d4af37]' :
                    m.status === 'reservada' ? 'bg-[#118ab2]' : 'bg-white/20'
                  }`} />
                  <Utensils className={`w-5 h-5 mx-auto mb-1 ${
                    m.status === 'libre' ? 'text-[#06d6a0]' : 'text-[#d4af37]'
                  }`} />
                  <div className="text-xs font-bold">{m.name || `Mesa ${m.number}`}</div>
                  <div className="text-[9px] text-white/40">{m.capacity} pers.</div>
                </button>
              );
            })}
          </div>
          {mesas.length === 0 && (
            <p className="text-center text-white/40 text-sm py-8">No hay mesas configuradas</p>
          )}
        </div>
      )}

      {/* ───── Vista: Menú ───── */}
      {view === 'menu' && (
        <div className="p-3 space-y-3">
          {/* Mesa seleccionada + carrito flotante */}
          {selectedMesa && (
            <div className="bg-[#9d4edd]/10 border border-[#9d4edd]/30 rounded-xl p-3 flex items-center justify-between">
              <div className="text-sm">
                <span className="text-white/50">Mesa: </span>
                <span className="text-white font-semibold">
                  {selectedMesa.name || `Mesa ${selectedMesa.number}`}
                </span>
              </div>
              <button
                onClick={() => { setSelectedMesa(null); setCart([]); }}
                className="text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 min-h-[40px]"
              >
                Cambiar
              </button>
            </div>
          )}

          {!selectedMesa && (
            <button
              onClick={() => setView('mesas')}
              className="w-full p-3 rounded-xl border border-dashed border-[#9d4edd]/40 bg-[#9d4edd]/10 text-white/80 text-sm font-medium"
            >
              + Seleccionar mesa primero
            </button>
          )}

          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="search"
              value={searchDish}
              onChange={e => setSearchDish(e.target.value)}
              placeholder="Buscar plato..."
              className="w-full bg-[#15151f] border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-white/30 min-h-[44px]"
            />
          </div>

          {/* Categorías scroll horizontal */}
          {menu && menu.categories.length > 1 && !searchDish && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
              {menu.categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-4 py-2.5 rounded-full text-xs whitespace-nowrap transition-colors min-h-[40px] flex items-center flex-shrink-0 ${
                    activeCategory === c.id
                      ? 'bg-[#9d4edd] text-white'
                      : 'bg-white/5 text-white/60'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Lista de platos */}
          {menu && (
            <div className="space-y-2">
              {(searchDish
                ? menu.categories.flatMap(c => c.dishes).filter(d =>
                    d.name.toLowerCase().includes(searchDish.toLowerCase())
                  )
                : menu.categories.find(c => c.id === activeCategory)?.dishes || []
              ).map(dish => (
                <button
                  key={dish.id}
                  onClick={() => addToCart(dish)}
                  className="w-full bg-[#15151f] border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left active:bg-[#1c1c2a] transition-colors"
                >
                  {dish.image_url ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#15151f]">
                      <img src={deriveVariantUrl(dish.image_url, 'thumb')} alt={dish.name} className="w-12 h-12 rounded-lg object-cover" loading="lazy" decoding="async" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Utensils className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{dish.name}</div>
                    {dish.description && (
                      <div className="text-[10px] text-white/40 line-clamp-1">{dish.description}</div>
                    )}
                    <div className="text-xs text-[#d4af37] font-semibold mt-0.5">S/ {dish.price.toFixed(2)}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#9d4edd]/20 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4 text-[#9d4edd]" />
                  </div>
                </button>
              ))}
              {searchDish && menu.categories.flatMap(c => c.dishes).filter(d =>
                d.name.toLowerCase().includes(searchDish.toLowerCase())
              ).length === 0 && (
                <p className="text-center text-white/40 text-sm py-6">Sin resultados</p>
              )}
            </div>
          )}

          {!menu && (
            <p className="text-center text-white/40 text-sm py-8">No hay menú configurado</p>
          )}
        </div>
      )}

      {/* ───── Vista: Comandas ───── */}
      {view === 'comandas' && (
        <div className="p-3 space-y-3">
          <p className="text-xs text-white/50">Comandas activas asignadas a ti</p>

          {/* Comandas offline en cola */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wide text-amber-400/80 font-bold flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> En cola offline ({pending.length})
              </div>
              {pending.map(p => (
                <div key={p.id} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-amber-200">
                        Pendiente · {p.mesaNumero}
                      </div>
                      <div className="text-[10px] text-amber-200/50">
                        Guardada {new Date(p.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-200">
                      {p.status === 'syncing' ? 'Enviando...' : 'Esperando'}
                    </span>
                  </div>
                  <div className="space-y-0.5 mb-2">
                    {p.items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-white font-bold">{it.cantidad}×</span>
                        <span className="text-white/80 flex-1 truncate">{it.nombre}</span>
                        <span className="text-white/40">S/ {(it.precio * it.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  {p.notas && (
                    <div className="text-[10px] text-amber-200/60 italic border-t border-amber-500/10 pt-1">
                      Nota: {p.notas}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Comandas activas online */}
          {comandas.length === 0 && pending.length === 0 ? (
            <p className="text-center text-white/40 text-sm py-8">No tienes comandas activas</p>
          ) : comandas.length > 0 && (
            comandas.map(c => {
              const status = STATUS_INFO[c.status];
              return (
                <div key={c.id} className="bg-[#15151f] border border-white/10 rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{c.order_number}</div>
                      <div className="text-xs text-white/50">
                        {c.table?.name || `Mesa ${c.table?.number}` || 'Para llevar'}
                        {' · '}
                        <Clock className="w-3 h-3 inline" /> {new Date(c.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: `${status.color}20`, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    {c.items.map(it => (
                      <div key={it.id} className="flex items-start gap-2 text-xs">
                        <span className="text-white font-bold">{it.quantity}×</span>
                        <div className="flex-1">
                          <span className="text-white/80">{it.menu_item_name}</span>
                          {it.notes && <div className="text-white/40 italic">↳ {it.notes}</div>}
                        </div>
                        <span className="text-white/40">S/ {(it.menu_item_price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-2">
                    <div className="text-sm font-bold text-white">
                      Total: <span className="text-[#d4af37]">S/ {c.total.toFixed(2)}</span>
                    </div>
                    {c.status === 'lista' && (
                      <button
                        onClick={() => patchComanda(c.id, 'marcar_entregada')}
                        className="px-3 py-1.5 rounded-lg bg-[#06d6a0] text-black text-xs font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Entregada
                      </button>
                    )}
                    {(c.status === 'borrador' || c.status === 'enviada') && (
                      <button
                        onClick={() => patchComanda(c.id, 'cancelar')}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ───── Carrito unificado (bottom sheet expandible) ───── */}
      {cart.length > 0 && view === 'menu' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 safe-bottom shadow-2xl">
          {/* Expandable lista de items (se abre desde el summary del bottom bar) */}
          {cartExpanded && (
            <div className="bg-[#0a0a14] border-t border-white/10 max-h-[45vh] overflow-y-auto px-3 py-2 scrollbar-none">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs py-2 border-b border-white/5 last:border-0"
                >
                  <button
                    onClick={() => updateQty(idx, -1)}
                    className="w-9 h-9 rounded-lg bg-white/10 active:bg-white/20 flex items-center justify-center flex-shrink-0 transition"
                    aria-label="Quitar uno"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white font-bold w-7 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(idx, 1)}
                    className="w-9 h-9 rounded-lg bg-white/10 active:bg-white/20 flex items-center justify-center flex-shrink-0 transition"
                    aria-label="Agregar uno"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate font-medium">{item.dish.name}</div>
                    <div className="text-white/40 text-[10px]">
                      S/ {item.dish.price.toFixed(2)} c/u · Subt. S/ {(item.dish.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="w-9 h-9 rounded-lg bg-red-500/20 active:bg-red-500/30 text-red-300 flex items-center justify-center flex-shrink-0 transition"
                    aria-label="Quitar del carrito"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Botón vaciar al final de la lista expandida */}
              <button
                onClick={() => { setCart([]); setCartExpanded(false); }}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-red-500/10 active:bg-red-500/20 text-red-300 text-xs font-medium transition"
              >
                Vaciar carrito
              </button>
            </div>
          )}

          {/* Bottom bar — SIEMPRE visible cuando hay items en el carrito */}
          <div className="bg-[#0a0a14] border-t border-white/10 p-3">
            {/* Fila 1: toggle expandir + total */}
            <button
              onClick={() => setCartExpanded(v => !v)}
              className="w-full flex items-center justify-between mb-2 active:opacity-80 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#9d4edd]/20 text-[#c77dff] text-xs font-bold flex-shrink-0">
                  {cart.length}
                </span>
                <span className="text-xs text-white/70 truncate">
                  {cart.length === 1 ? '1 plato' : `${cart.length} platos`}
                  {!selectedMesa && ' · Selecciona mesa'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold text-[#d4af37]">S/ {cartTotal.toFixed(2)}</span>
                <ChevronUp
                  className={`w-4 h-4 text-white/50 transition-transform ${cartExpanded ? '' : 'rotate-180'}`}
                />
              </div>
            </button>

            {/* Fila 2: botón enviar (full width) */}
            <button
              onClick={sendComanda}
              disabled={!selectedMesa || sending}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#9d4edd] to-[#d4af37] text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.99] transition"
            >
              {sending ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="w-4 h-4" /> Enviar a cocina</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de tutorial (auto-abierto la primera vez, reabrible desde botón "Guía") */}
      <MozoTutorial
        open={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        waiterName={waiterName}
        planId={planId}
      />
    </div>
  );
}

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: '#6b7280' },
  enviada: { label: 'Enviada', color: '#118ab2' },
  en_preparacion: { label: 'En cocina', color: '#d4af37' },
  lista: { label: 'Lista', color: '#06d6a0' },
  entregada: { label: 'Entregada', color: '#9d4edd' },
  facturada: { label: 'Facturada', color: '#e63946' },
  cancelada: { label: 'Cancelada', color: '#6b7280' },
};

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm transition-colors min-h-[44px] ${
        active ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:bg-white/5'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
