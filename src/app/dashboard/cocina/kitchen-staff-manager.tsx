'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, RefreshCw, Trash2, X, ChefHat, QrCode, Copy, Phone,
  ToggleLeft, ToggleRight, AlertCircle, Eye, EyeOff, KeyRound,
  Shuffle, Lock, ExternalLink, Info, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface KitchenStaff {
  id: string;
  full_name: string;
  document_id: string | null;
  phone: string | null;
  pin: string | null;
  password: string | null;
  is_active: boolean;
  qr_token: string | null;
  created_at: string;
}

/**
 * Sección colapsable para gestionar personal de cocina (cocineros).
 *
 * Se embebe al inicio del dashboard de cocina (/dashboard/cocina).
 * Cada cocinero tiene:
 *  - Nombre + documento + teléfono
 *  - QR token único → enlace externo /cocina/{token}
 *  - Contraseña opcional (Premium+)
 *  - Estado activo/inactivo
 *
 * La arquitectura es idéntica a /dashboard/mozos pero filtra por role='cocinero'.
 */
export function KitchenStaffManager() {
  const [staff, setStaff] = useState<KitchenStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showQrFor, setShowQrFor] = useState<KitchenStaff | null>(null);
  const [newStaff, setNewStaff] = useState({
    full_name: '', document_id: '', phone: '', pin: '', password: '',
  });
  const [showPwdNew, setShowPwdNew] = useState(false);
  const [showPwdRow, setShowPwdRow] = useState<Record<string, boolean>>({});
  const [editingPwd, setEditingPwd] = useState<KitchenStaff | null>(null);
  const [editPwdValue, setEditPwdValue] = useState('');
  const [showEditPwd, setShowEditPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/waiters?role=cocinero');
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Error');
      }
      const data = await res.json();
      setStaff(data.waiters || []);
    } catch (err) {
      // Silencioso en producción — no bloquear el dashboard de cocina
      console.warn('[KitchenStaffManager] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaff.full_name.trim()) {
      toast.error('Nombre es requerido');
      return;
    }
    try {
      const res = await fetch('/api/waiters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newStaff.full_name.trim(),
          document_id: newStaff.document_id || undefined,
          phone: newStaff.phone || undefined,
          pin: newStaff.pin || undefined,
          password: newStaff.password || undefined,
          role: 'cocinero',
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');
      toast.success(`Cocinero "${d.waiter.full_name}" creado`);
      setShowAdd(false);
      setNewStaff({ full_name: '', document_id: '', phone: '', pin: '', password: '' });
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleToggle(s: KitchenStaff) {
    try {
      const res = await fetch(`/api/waiters/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (!res.ok) throw new Error('Error');
      toast.success(s.is_active ? 'Cocinero desactivado' : 'Cocinero activado');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(s: KitchenStaff) {
    if (!confirm(`¿Eliminar a ${s.full_name}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/waiters/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Cocinero eliminado');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleRegenerateQr(s: KitchenStaff) {
    if (!confirm('¿Regenerar enlace? El enlace anterior dejará de funcionar.')) return;
    try {
      const res = await fetch(`/api/waiters/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_qr: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');
      toast.success('Nuevo enlace generado');
      await load();
      setShowQrFor(d.waiter);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleSavePwd() {
    if (!editingPwd) return;
    setPwdSaving(true);
    try {
      const res = await fetch(`/api/waiters/${editingPwd.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: editPwdValue || null }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');
      toast.success(editPwdValue ? 'Contraseña actualizada' : 'Contraseña eliminada');
      setEditingPwd(null);
      setEditPwdValue('');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPwdSaving(false);
    }
  }

  async function handleResetPwd(s: KitchenStaff) {
    if (!confirm('¿Generar contraseña aleatoria de 6 caracteres?')) return;
    try {
      const res = await fetch(`/api/waiters/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_password: true }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Error');
      toast.success('Contraseña aleatoria generada');
      await load();
      setShowPwdRow(r => ({ ...r, [s.id]: true }));
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copiado al portapapeles'),
      () => toast.error('No se pudo copiar')
    );
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden mb-6">
      {/* Header (collapsible) */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-[#1a1a2e]" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold flex items-center gap-2">
              Personal de Cocina
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#d4af37]/15 text-[#d4af37] font-semibold">
                {staff.length}
              </span>
            </h2>
            <p className="text-xs text-white/50">
              Crea perfiles para cocineros — cada uno con su enlace externo y QR
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-white/40">
            {collapsed ? 'Expandir' : 'Colapsar'}
          </span>
          {collapsed ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronUp className="w-5 h-5 text-white/40" />}
        </div>
      </button>

      {/* Body — colapsable */}
      {!collapsed && (
        <div className="border-t border-white/10 p-4 sm:p-5 space-y-4">
          {/* Banner informativo */}
          <div className="bg-gradient-to-r from-[#d4af37]/10 to-transparent border border-[#d4af37]/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 text-xs sm:text-sm text-white/70">
              <Info className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Cada cocinero tiene su propio perfil y enlace externo.</strong>{' '}
                Igual que los mozos, acceden por QR o URL única sin iniciar sesión con tu cuenta.
                Las comandas que marquen como listas/entregadas quedarán registradas a su nombre.
              </div>
            </div>
          </div>

          {/* Botón agregar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-white/50">
              Total: <strong className="text-white">{staff.length}</strong> cocinero(s) ·{' '}
              <span className="text-[#06d6a0]">{staff.filter(s => s.is_active).length} activos</span>
            </p>
            <Button
              size="sm"
              onClick={() => setShowAdd(true)}
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar cocinero
            </Button>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-8 text-white/40">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
              Cargando personal...
            </div>
          )}

          {/* Empty state */}
          {!loading && staff.length === 0 && (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <ChefHat className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/60 text-sm font-medium mb-1">Sin cocineros todavía</p>
              <p className="text-white/40 text-xs mb-4">
                Crea perfiles para que tu equipo de cocina acceda a las comandas en tiempo real.
              </p>
              <Button
                size="sm"
                onClick={() => setShowAdd(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-1" /> Crear primer cocinero
              </Button>
            </div>
          )}

          {/* Lista de cocineros */}
          {staff.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {staff.map(s => {
                const externalUrl = s.qr_token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cocina/${s.qr_token}` : null;
                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-4 ${s.is_active ? 'bg-[#15151f] border-white/10' : 'bg-white/[0.02] border-white/5 opacity-60'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#d4af37]/30 to-[#f4d35e]/30 flex items-center justify-center flex-shrink-0">
                          <ChefHat className="w-5 h-5 text-[#d4af37]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm truncate">{s.full_name}</div>
                          <div className="text-[10px] text-white/40">
                            {s.is_active ? '🟢 Activo' : '⚫ Inactivo'}
                            {s.phone && ` · ${s.phone}`}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggle(s)}
                        className="flex-shrink-0"
                        title={s.is_active ? 'Desactivar' : 'Activar'}
                      >
                        {s.is_active
                          ? <ToggleRight className="w-8 h-8 text-[#06d6a0]" />
                          : <ToggleLeft className="w-8 h-8 text-white/40" />}
                      </button>
                    </div>

                    {/* Enlace externo */}
                    {externalUrl && (
                      <div className="bg-black/30 rounded-lg p-2 mb-3">
                        <div className="text-[9px] text-white/40 uppercase tracking-wide mb-1">Enlace externo</div>
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#d4af37] truncate">
                          <span className="truncate flex-1">/cocina/{s.qr_token!.slice(0, 12)}…</span>
                          <button
                            onClick={() => copyToClipboard(externalUrl)}
                            className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
                            title="Copiar enlace"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <a
                            href={externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-white/10 rounded transition flex-shrink-0"
                            title="Abrir en nueva pestaña"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Contraseña indicator */}
                    <div className="flex items-center gap-2 text-[11px] mb-3">
                      {s.password ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#9d4edd]/15 text-[#c77dff] flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Protegido
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                          Sin contraseña
                        </span>
                      )}
                      {s.pin && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/40">
                          PIN: {showPwdRow[s.id] ? s.pin : '••••'}
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowQrFor(s)}
                        className="h-8 text-[11px]"
                      >
                        <QrCode className="w-3 h-3 mr-1" /> Ver QR
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPwd(s);
                          setEditPwdValue(s.password || '');
                          setShowEditPwd(false);
                        }}
                        className="h-8 text-[11px]"
                      >
                        <KeyRound className="w-3 h-3 mr-1" /> Contraseña
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRegenerateQr(s)}
                        className="h-8 text-[11px]"
                      >
                        <Shuffle className="w-3 h-3 mr-1" /> Nuevo enlace
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(s)}
                        className="h-8 text-[11px] text-red-400 hover:text-red-300 border-red-500/30 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Modal Agregar ─── */}
      {showAdd && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0a0a14] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#0a0a14] border-b border-white/10 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-[#d4af37]" /> Nuevo cocinero
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/5 rounded-lg transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-3">
              <div>
                <Label className="text-xs text-white/60 mb-1.5 block">Nombre completo *</Label>
                <Input
                  value={newStaff.full_name}
                  onChange={e => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="bg-white/5 border-white/10"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-white/60 mb-1.5 block">Documento</Label>
                  <Input
                    value={newStaff.document_id}
                    onChange={e => setNewStaff({ ...newStaff, document_id: e.target.value })}
                    placeholder="DNI"
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-xs text-white/60 mb-1.5 block">Teléfono</Label>
                  <Input
                    value={newStaff.phone}
                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="987654321"
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-white/60 mb-1.5 block">PIN (opcional, 4-6 dígitos)</Label>
                <Input
                  value={newStaff.pin}
                  onChange={e => setNewStaff({ ...newStaff, pin: e.target.value })}
                  placeholder="0000"
                  maxLength={6}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div>
                <Label className="text-xs text-white/60 mb-1.5 block">Contraseña (opcional)</Label>
                <div className="relative">
                  <Input
                    type={showPwdNew ? 'text' : 'password'}
                    value={newStaff.password}
                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                    placeholder="Cadena libre — el cocinero la ingresa al abrir su panel"
                    className="bg-white/5 border-white/10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwdNew(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
                  >
                    {showPwdNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdd(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-1" /> Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Contraseña ─── */}
      {editingPwd && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setEditingPwd(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0a0a14] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md"
          >
            <div className="border-b border-white/10 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Contraseña de {editingPwd.full_name}</h3>
              <button onClick={() => setEditingPwd(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <Label className="text-xs text-white/60 mb-1.5 block">
                  Nueva contraseña (vacío = eliminar)
                </Label>
                <div className="relative">
                  <Input
                    type={showEditPwd ? 'text' : 'password'}
                    value={editPwdValue}
                    onChange={e => setEditPwdValue(e.target.value)}
                    placeholder="Cadena libre"
                    className="bg-white/5 border-white/10 pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPwd(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white"
                  >
                    {showEditPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleResetPwd(editingPwd)}
                  className="flex-1"
                >
                  <Shuffle className="w-4 h-4 mr-1" /> Aleatoria
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePwd}
                  disabled={pwdSaving}
                  className="flex-1 bg-[#d4af37] text-[#1a1a2e] hover:opacity-90"
                >
                  {pwdSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Guardar'}
                </Button>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed pt-2 border-t border-white/5">
                Si eliminas la contraseña, el panel del cocinero será accesible solo con el enlace (sin contraseña).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal QR ─── */}
      {showQrFor && showQrFor.qr_token && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowQrFor(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#0a0a14] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-[#0a0a14] border-b border-white/10 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#d4af37]" /> QR de {showQrFor.full_name}
              </h3>
              <button onClick={() => setShowQrFor(null)} className="p-2 hover:bg-white/5 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="bg-white p-4 rounded-xl flex justify-center mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/cocina/${showQrFor.qr_token}`
                  )}`}
                  alt="QR"
                  width={240}
                  height={240}
                  className="rounded-lg"
                />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3 text-xs text-amber-200">
                <Info className="w-3.5 h-3.5 inline mr-1" />
                El cocinero escanea este QR o abre el enlace desde su celular. No necesita iniciar sesión con tu cuenta.
              </div>
              <div className="bg-black/30 rounded-lg p-2 mb-3">
                <div className="text-[10px] text-white/40 uppercase mb-1">Enlace externo</div>
                <div className="text-[11px] font-mono text-[#d4af37] break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/cocina/{showQrFor.qr_token}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/cocina/${showQrFor.qr_token}`)}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-1" /> Copiar enlace
                </Button>
                <a
                  href={`${typeof window !== 'undefined' ? window.location.origin : ''}/cocina/${showQrFor.qr_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-[#d4af37] text-[#1a1a2e] text-sm font-semibold hover:opacity-90 transition"
                >
                  <ExternalLink className="w-4 h-4" /> Abrir
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
