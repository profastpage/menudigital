'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Plus,
  ExternalLink,
  Pencil,
  QrCode,
  Trash2,
  Eye,
  LogOut,
  Sparkles,
  Loader2,
  Globe,
  BarChart3,
  CreditCard,
  Download,
  Upload,
  MoreVertical,
  LayoutDashboard,
  Copy,
  Crown,
  Shield,
} from 'lucide-react';
import type { Plan } from '@/lib/plans';
import type { MenuData } from '@/lib/menu-utils';
import {
  detectFileType,
  importFromJSON,
  importFromCSV,
  importFromExcelXML,
  type ImportCategory,
} from '@/lib/import-export';

interface Props {
  user: { email: string; name: string };
  plan: Plan;
  menus: MenuData[];
  isSuperAdmin?: boolean;
}

export function DashboardClient({ user, plan, menus, isSuperAdmin = false }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const router = useRouter();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importTarget, setImportTarget] = useState<string | null>(null);

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error('Ingresa un nombre');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      toast.success('Menú creado');
      router.push(`/dashboard/${data.menu.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el menú "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Menú eliminado');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function handleExport(menuId: string, menuName: string, format: string) {
    try {
      const res = await fetch(`/api/menus/${menuId}/export?format=${format}`);
      if (!res.ok) throw new Error('Error exportando');
      const blob = await res.blob();
      const ext = format === 'excel' ? 'xls' : format === 'word' ? 'doc' : format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = menuName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '-');
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exportado como .${ext}`);
    } catch {
      toast.error('Error al exportar');
    }
  }

  async function handleImport(menuId: string) {
    setImportTarget(menuId);
    importFileRef.current?.click();
  }

  async function processImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !importTarget) return;

    setImporting(true);
    try {
      const text = await file.text();
      const fileType = detectFileType(file.name, text);

      if (fileType === 'unknown') {
        toast.error('Formato no reconocido. Usa JSON, CSV o Excel.');
        setImporting(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/menus/${importTarget}/import`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error importando');

      toast.success(data.message || `Importados: ${data.imported?.categories} categorías, ${data.imported?.dishes} platos`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
      setImportTarget(null);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  }

  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(`${origin}/r/${slug}`);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  }

  const canCreate = plan.limits.maxMenus === -1 || menus.length < plan.limits.maxMenus;

  return (
    <div className="min-h-screen bg-[#07070b] text-white flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-white/10 bg-[#0a0a14] p-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-lg font-bold text-[#1a1a2e]">
            M
          </div>
          <div className="font-bold">MenuPro</div>
        </div>

        <nav className="space-y-1 flex-1">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            Mis menús
          </a>
          <a
            href="/dashboard/generador"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Generador rápido
          </a>
          <a
            href="/dashboard/analytics"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analíticas
            <Crown className="w-3 h-3 text-[#d4af37] ml-auto" />
          </a>
          <a
            href="/dashboard/domains"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <Globe className="w-4 h-4" />
            Dominios
            <Crown className="w-3 h-3 text-[#d4af37] ml-auto" />
          </a>
          <a
            href="/dashboard/billing"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Planes
          </a>
          {isSuperAdmin && (
            <a
              href="/superadmin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-amber-400/80 hover:text-amber-400 hover:bg-amber-400/5 text-sm transition-colors border border-amber-400/20 mt-2"
            >
              <Shield className="w-4 h-4" />
              Super Admin
            </a>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="px-3 space-y-1">
            <div className="text-sm text-white/80 truncate">{user.email}</div>
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                plan.id === 'pro'
                  ? 'bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {plan.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-white/10 bg-[#0a0a14] backdrop-blur sticky top-0 z-40">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-sm font-bold text-[#1a1a2e]">
                M
              </div>
              <span className="font-bold">MenuPro</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  plan.id === 'pro'
                    ? 'bg-[#d4af37]/20 text-[#d4af37]'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {plan.name}
              </span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/60">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
            <a href="/dashboard" className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium whitespace-nowrap">Menús</a>
            <a href="/dashboard/generador" className="px-3 py-1.5 rounded-lg text-white/50 text-xs whitespace-nowrap">Generador</a>
            <a href="/dashboard/analytics" className="px-3 py-1.5 rounded-lg text-white/50 text-xs whitespace-nowrap">Analíticas</a>
            <a href="/dashboard/domains" className="px-3 py-1.5 rounded-lg text-white/50 text-xs whitespace-nowrap">Dominios</a>
            <a href="/dashboard/billing" className="px-3 py-1.5 rounded-lg text-white/50 text-xs whitespace-nowrap">Planes</a>
            {isSuperAdmin && (
              <a href="/superadmin" className="px-3 py-1.5 rounded-lg text-amber-400 text-xs whitespace-nowrap">Admin</a>
            )}
          </div>
        </header>

        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Mis menús</h1>
              <p className="text-white/60">
                {menus.length} {menus.length === 1 ? 'menú creado' : 'menús creados'} · Plan {plan.name}
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  disabled={!canCreate}
                  className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo menú
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#15152a] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Crear nuevo menú</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre del restaurante</Label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Ej: La Parrilla del Chef"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e]"
                  >
                    {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Crear menú
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Import file input (hidden) */}
          <input
            ref={importFileRef}
            type="file"
            accept=".json,.csv,.xls,.xlsx"
            className="hidden"
            onChange={processImport}
          />

          {/* Loading import */}
          {importing && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-[#15152a] border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
                <div className="text-center">
                  <div className="font-semibold">Importando menú...</div>
                  <div className="text-sm text-white/50">Procesando archivo</div>
                </div>
              </div>
            </div>
          )}

          {!canCreate && (
            <div className="mb-6 p-5 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#d4af37]" />
                <div>
                  <div className="font-semibold">Has alcanzado el límite del plan Free</div>
                  <div className="text-sm text-white/60">
                    Upgrade a Pro para crear menús ilimitados por S/35/mes
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e]"
              >
                <a href="/dashboard/billing">Ver planes</a>
              </Button>
            </div>
          )}

          {menus.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Aún no tienes menús</h3>
              <p className="text-white/60 mb-6">
                Crea tu primer menú digital en menos de 5 minutos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className="group bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#d4af37]/40 transition-all"
                >
                  {/* Preview header */}
                  <div
                    className="h-32 relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${menu.color}, ${menu.color}99)`,
                    }}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg line-clamp-1">{menu.name}</div>
                        {menu.slogan && (
                          <div className="text-xs opacity-80 line-clamp-1">{menu.slogan}</div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          menu.is_published
                            ? 'bg-black/30 text-white'
                            : 'bg-black/40 text-white/60'
                        }`}
                      >
                        {menu.is_published ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 text-xs text-white/50 mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {menu.views_count} visitas
                      </span>
                      <span>·</span>
                      <button
                        onClick={() => copyLink(menu.slug)}
                        className="truncate hover:text-[#d4af37] transition-colors"
                        title="Copiar enlace"
                      >
                        {origin}/r/{menu.slug}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        asChild
                        className="flex-1 bg-white/5 border border-white/10 text-white hover:bg-white/10"
                      >
                        <a href={`/dashboard/${menu.id}`}>
                          <Pencil className="w-3.5 h-3.5" />
                          Editar
                        </a>
                      </Button>

                      {/* More options dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/70 hover:text-white hover:bg-white/5"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#15152a] border-white/10">
                          {menu.is_published && (
                            <DropdownMenuItem asChild className="text-white focus:bg-white/5 focus:text-white">
                              <a href={`/r/${menu.slug}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Ver público
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => copyLink(menu.slug)}
                            className="text-white focus:bg-white/5 focus:text-white"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar enlace
                          </DropdownMenuItem>
                          {plan.limits.hasQR && menu.is_published && (
                            <DropdownMenuItem asChild className="text-white focus:bg-white/5 focus:text-white">
                              <a href={`/dashboard/${menu.id}/qr`}>
                                <QrCode className="w-4 h-4 mr-2" />
                                Código QR
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => handleImport(menu.id)}
                            className="text-white focus:bg-white/5 focus:text-white"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Importar platos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => handleExport(menu.id, menu.name, 'json')}
                            className="text-white focus:bg-white/5 focus:text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExport(menu.id, menu.name, 'csv')}
                            className="text-white focus:bg-white/5 focus:text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExport(menu.id, menu.name, 'excel')}
                            className="text-white focus:bg-white/5 focus:text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExport(menu.id, menu.name, 'word')}
                            className="text-white focus:bg-white/5 focus:text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar Word
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem
                            onClick={() => handleDelete(menu.id, menu.name)}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick tips */}
          {menus.length > 0 && menus.length <= 2 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#d4af37]" />
                  Importa rápido
                </div>
                <div className="text-white/50">
                  Sube tu carta en CSV o JSON para llenar tu menú en segundos.
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#d4af37]" />
                  Exporta en Excel
                </div>
                <div className="text-white/50">
                  Descarga tu menú en Excel, Word, CSV o JSON para compartir.
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#d4af37]" />
                  Dominio propio
                </div>
                <div className="text-white/50">
                  Usa tu propio dominio con el plan Pro. Sin branding.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
