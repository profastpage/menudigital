'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Shield,
  Crown,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface Menu {
  id: string;
  name: string;
  slug: string;
  is_published: boolean;
}

interface Domain {
  id: string;
  domain: string;
  menu_id: string | null;
  is_verified: boolean;
  ssl_status: string;
  verification_token: string;
  dns_checked_at: string | null;
  created_at: string;
  menus?: { name: string; slug: string } | null;
}

interface Props {
  plan: string;
  menus: Menu[];
}

export function DomainsClient({ plan, menus }: Props) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [selectedMenu, setSelectedMenu] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  async function fetchDomains() {
    try {
      const res = await fetch('/api/domains');
      if (res.status === 403) return; // No Pro
      const data = await res.json();
      setDomains(data.domains || []);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newDomain.trim()) {
      toast.error('Ingresa un dominio');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: newDomain,
          menu_id: selectedMenu || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      toast.success('Dominio agregado. Configura los registros DNS.');
      setNewDomain('');
      setSelectedMenu('');
      fetchDomains();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setAdding(false);
    }
  }

  async function handleVerify(id: string) {
    setVerifying(id);
    try {
      const res = await fetch('/api/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      toast.success('Dominio verificado correctamente');
      fetchDomains();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setVerifying(null);
    }
  }

  async function handleDelete(id: string, domain: string) {
    if (!confirm(`¿Eliminar dominio ${domain}?`)) return;
    setDeleting(id);
    try {
      const res = await fetch('/api/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      toast.success('Dominio eliminado');
      fetchDomains();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeleting(null);
    }
  }

  async function handleLinkMenu(domainId: string, menuId: string) {
    try {
      const res = await fetch('/api/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: domainId, menu_id: menuId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      toast.success('Menú vinculado al dominio');
      fetchDomains();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  // No Pro: upsell
  if (plan !== 'pro') {
    return (
      <div className="min-h-screen bg-[#07070b] text-white">
        <header className="border-b border-white/10 bg-[#0a0a14]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
            <a href="/dashboard" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <span className="font-semibold">Dominios personalizados</span>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-6">
            <Globe className="w-10 h-10 text-[#d4af37]" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Dominios personalizados (Pro)</h1>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Conecta tu propio dominio (ej: menu.mirestaurante.com) para que
            tus clientes accedan directamente sin pasar por nuestro enlace.
          </p>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 mb-8 max-w-md mx-auto">
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold">S/ 35</span>
              <span className="text-white/50">/mes</span>
            </div>
            <div className="text-sm text-white/60 mb-6">≈ $9 USD</div>
            <Button
              asChild
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90 font-semibold"
            >
              <a href="/dashboard/billing">Upgrade a Pro</a>
            </Button>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 max-w-md mx-auto text-left">
            <h3 className="font-semibold mb-3">¿Qué incluye?</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>• Hasta 3 dominios personalizados</li>
              <li>• SSL gratuito automático</li>
              <li>• Instrucciones DNS paso a paso</li>
              <li>• Verificación automática</li>
            </ul>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <header className="border-b border-white/10 bg-[#0a0a14]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-white/60 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div>
              <span className="font-semibold">Dominios personalizados</span>
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <Crown className="w-3 h-3 text-[#d4af37]" />
                Solo Pro
              </div>
            </div>
          </div>
          <a
            href="/dashboard/billing"
            className="text-sm text-white/60 hover:text-white"
          >
            Plan Pro
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Formulario agregar */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="font-semibold mb-4">Agregar dominio</h2>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3">
            <div className="space-y-2">
              <Label>Tu dominio</Label>
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="menu.mirestaurante.com"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Menú a vincular</Label>
              <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Ninguno" />
                </SelectTrigger>
                <SelectContent className="bg-[#15152a] border-white/10">
                  {menus.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-white">
                      {m.name} {m.is_published ? '✓' : '(borrador)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAdd}
                disabled={adding}
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90"
              >
                {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Agregar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de dominios */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#d4af37]" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-16">
            <Globe className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin dominios personalizados</h3>
            <p className="text-white/50">
              Agrega tu primer dominio para dar una experiencia profesional a tus clientes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((d) => (
              <div
                key={d.id}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[#d4af37]" />
                      <span className="font-semibold text-lg">{d.domain}</span>
                      {d.is_verified ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Verificado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold">
                          <XCircle className="w-3 h-3" /> Sin verificar
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        d.ssl_status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : d.ssl_status === 'failed'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-white/5 text-white/60'
                      }`}>
                        SSL: {d.ssl_status}
                      </span>
                    </div>

                    {/* Menú vinculado */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/50">Menú vinculado:</span>
                      <Select
                        value={d.menu_id || ''}
                        onValueChange={(v) => handleLinkMenu(d.id, v)}
                      >
                        <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white h-8 text-sm">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#15152a] border-white/10">
                          {menus.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="text-white">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* DNS info */}
                    {!d.is_verified && (
                      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 mt-3">
                        <h4 className="text-sm font-semibold mb-2">Registros DNS a configurar:</h4>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex gap-3">
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[#d4af37]">CNAME</span>
                            <span className="text-white/70">{d.domain}</span>
                            <span className="text-white/40">→ menudigital-pro.vercel.app</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleVerify(d.id)}
                          disabled={verifying === d.id}
                          className="mt-3 bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90"
                        >
                          {verifying === d.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          )}
                          Verificar DNS
                        </Button>
                      </div>
                    )}

                    {d.is_verified && (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          Dominio activo con SSL. Los visitantes verán tu menú en{' '}
                          <a
                            href={`https://${d.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#d4af37] hover:underline"
                          >
                            https://{d.domain}
                            <ExternalLink className="w-3 h-3 inline ml-0.5" />
                          </a>
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(d.id, d.domain)}
                    disabled={deleting === d.id}
                    className="text-white/40 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                  >
                    {deleting === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold mb-3">¿Cómo funcionan los dominios personalizados?</h3>
          <ol className="space-y-2 text-sm text-white/70 list-decimal list-inside">
            <li>Registra tu dominio en un proveedor (Namecheap, GoDaddy, NIC, etc.)</li>
            <li>Agrega el dominio aquí y configura el registro CNAME en tu DNS</li>
            <li>Haz clic en &quot;Verificar DNS&quot; cuando los registros estén propagados</li>
            <li>El SSL se activa automáticamente y tu menú es accesible en tu dominio</li>
          </ol>
          <p className="text-xs text-white/40 mt-4">
            Máximo 3 dominios por cuenta Pro. La propagación DNS puede tomar hasta 48 horas.
          </p>
        </div>
      </main>
    </div>
  );
}
