'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClipboardList, Send, Check, X, Plus, Minus, Search,
  RefreshCw, AlertCircle, Utensils, ChefHat, Clock, User,
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Carrito para crear comanda
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [cart, setCart] = useState<{ dish: Dish; quantity: number; notes: string }[]>([]);
  const [searchDish, setSearchDish] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [partySize, setPartySize] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/mozo-panel?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error cargando datos');
      }
      const d = await res.json();
      setMesas(d.mesas || []);
      setMenu(d.menu || null);
      setComandas(d.comandas || []);
      if (d.menu?.categories?.length) {
        setActiveCategory(d.menu.categories[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    // Auto-refresh cada 20s para ver comandas activas
    const i = setInterval(load, 20000);
    return () => clearInterval(i);
  }, [load]);

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
    try {
      const res = await fetch('/api/mozo-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setSelectedMesa(null);
      setCustomerName('');
      setPartySize('');
      setOrderNotes('');
      setView('comandas');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  async function patchComanda(orderId: string, action: 'marcar_entregada' | 'cancelar') {
    try {
      const res = await fetch('/api/mozo-panel', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
  if (loading && mesas.length === 0) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-1">No se pudo cargar</p>
          <p className="text-white/50 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ───── Layout móvil ─────
  return (
    <div className="min-h-screen bg-[#07070b] text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0a14] border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#9d4edd] to-[#d4af37] flex items-center justify-center text-lg flex-shrink-0">
              👨‍🍳
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold truncate">{waiterName}</div>
              <div className="text-[10px] text-white/40">Panel del mozo</div>
            </div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center"
            aria-label="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Tabs superiores */}
      <div className="sticky top-[64px] z-20 bg-[#0a0a14]/95 backdrop-blur border-b border-white/5">
        <div className="grid grid-cols-3 px-2 py-2 gap-1">
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
                      ? 'border-[#9d4edd] bg-[#9d4edd]/20'
                      : isFree
                      ? 'border-white/10 bg-white/5 hover:border-[#06d6a0]/50'
                      : 'border-white/10 bg-white/5 hover:border-[#d4af37]/50'
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
                className="text-white/40 hover:text-white text-xs"
              >
                Cambiar
              </button>
            </div>
          )}

          {!selectedMesa && (
            <button
              onClick={() => setView('mesas')}
              className="w-full p-3 rounded-xl border border-dashed border-white/20 text-white/60 text-sm"
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
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30"
            />
          </div>

          {/* Categorías scroll horizontal */}
          {menu && menu.categories.length > 1 && !searchDish && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3">
              {menu.categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 text-left active:bg-white/10 transition-colors"
                >
                  {dish.image_url ? (
                    <img src={dish.image_url} alt={dish.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
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
          {comandas.length === 0 ? (
            <p className="text-center text-white/40 text-sm py-8">No tienes comandas activas</p>
          ) : (
            comandas.map(c => {
              const status = STATUS_INFO[c.status];
              return (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
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

      {/* ───── Carrito flotante ───── */}
      {cart.length > 0 && view === 'menu' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a14] border-t border-white/10 p-3 safe-bottom">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white/50">{cart.length} plato(s) · Total</span>
            <span className="text-lg font-bold text-[#d4af37]">S/ {cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCart([])}
              className="px-3 py-2.5 rounded-xl bg-white/5 text-white/60 text-xs"
            >
              Vaciar
            </button>
            <button
              onClick={sendComanda}
              disabled={!selectedMesa || sending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9d4edd] to-[#d4af37] text-white font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
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

      {/* ───── Modal detalle carrito ───── */}
      {cart.length > 0 && view === 'menu' && (
        <div className="fixed bottom-[100px] left-0 right-0 z-30 px-3">
          <details className="bg-white/5 border border-white/10 rounded-xl">
            <summary className="px-3 py-2 text-xs text-white/70 cursor-pointer">
              Ver carrito ({cart.length})
            </summary>
            <div className="p-2 space-y-2 max-h-[40vh] overflow-y-auto">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => updateQty(idx, -1)}
                    className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-white font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(idx, 1)}
                    className="w-6 h-6 rounded bg-white/10 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{item.dish.name}</div>
                    <div className="text-white/40">S/ {(item.dish.price * item.quantity).toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    className="w-6 h-6 rounded bg-red-500/20 text-red-300 flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
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
      className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs transition-colors ${
        active ? 'bg-white/10 text-white font-medium' : 'text-white/50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
