'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import type { Plan } from '@/lib/plans';
import type { MenuData } from '@/lib/menu-utils';

interface Props {
  user: { email: string; name: string };
  plan: Plan;
  menus: MenuData[];
}

export function DashboardClient({ user, plan, menus }: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const router = useRouter();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

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

  const canCreate = plan.limits.maxMenus === -1 || menus.length < plan.limits.maxMenus;

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#0a0a14] backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-lg font-bold text-[#1a1a2e]">
              M
            </div>
            <div>
              <div className="font-bold">MenuPro</div>
              <div className="text-xs text-white/50">Dashboard</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
              <span className="text-white/60">{user.email}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
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
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <div className="flex items-center gap-3 text-xs text-white/50 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {menu.views_count} visitas
                    </span>
                    <span>·</span>
                    <span className="truncate">
                      {origin}/r/{menu.slug}
                    </span>
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
                    {menu.is_published && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="text-white/70 hover:text-white hover:bg-white/5"
                      >
                        <a href={`/r/${menu.slug}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    {plan.limits.hasQR && menu.is_published && (
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="text-white/70 hover:text-white hover:bg-white/5"
                      >
                        <a href={`/dashboard/${menu.id}/qr`}>
                          <QrCode className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(menu.id, menu.name)}
                      className="text-white/70 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
