'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  ExternalLink,
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { COLORS, CURRENCIES, type Plan } from '@/lib/plans';
import type { MenuData, ProfileData } from '@/lib/menu-utils';
import { buildMenuHTML } from './menu-html-builder';
import { ImageUploader } from './image-uploader';

interface Props {
  initialMenu: MenuData;
  plan: Plan;
  profile: ProfileData;
  imagesCount: number;
}

interface LocalCategory {
  id: string;
  name: string;
  dishes: LocalDish[];
}

interface LocalDish {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
}

export function EditorClient({ initialMenu, plan, profile, imagesCount }: Props) {
  const router = useRouter();
  const [menu, setMenu] = useState({
    name: initialMenu.name || '',
    slogan: initialMenu.slogan || '',
    description: initialMenu.description || '',
    whatsapp: initialMenu.whatsapp || '',
    logo: initialMenu.logo_url || '',
    color: initialMenu.color || '#ff6b35',
    currency: initialMenu.currency || 'S/',
    is_published: initialMenu.is_published || false,
  });
  const [categories, setCategories] = useState<LocalCategory[]>(
    initialMenu.categories?.map((c) => ({
      id: c.id,
      name: c.name,
      dishes: c.dishes?.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description || '',
        price: String(d.price),
        image: d.image_url || '',
      })) || [],
    })) || [{ id: 'new-1', name: '', dishes: [{ id: 'd-1', name: '', description: '', price: '', image: '' }] }]
  );
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Marcar como dirty cuando cambia algo
  useEffect(() => {
    dirtyRef.current = true;
  }, [menu, categories]);

  // Auto-guardado cada 3s si hay cambios
  const save = useCallback(async (silent = true) => {
    if (!dirtyRef.current) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/menus/${initialMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menu,
          categories: categories.map((c) => ({
            name: c.name,
            dishes: c.dishes.map((d) => ({
              name: d.name,
              description: d.description,
              price: d.price,
              image_url: d.image,
            })),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      dirtyRef.current = false;
      setSavedAt(new Date());
    } catch (err) {
      if (!silent) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar');
      }
    } finally {
      setSaving(false);
    }
  }, [menu, categories, initialMenu.id]);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => save(true), 3000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [menu, categories, save]);

  // Vista previa en vivo (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = {
        id: initialMenu.id,
        user_id: profile.id,
        name: menu.name || 'Mi Restaurante',
        slug: initialMenu.slug,
        slogan: menu.slogan || null,
        description: menu.description || null,
        whatsapp: menu.whatsapp || '0000000000',
        logo_url: menu.logo || null,
        color: menu.color,
        currency: menu.currency,
        branding_text: plan.limits.hasBranding ? 'Creado con MenuPro' : null,
        is_published: menu.is_published,
        views_count: 0,
        created_at: '',
        updated_at: '',
        categories: categories.map((c) => ({
          id: c.id,
          menu_id: initialMenu.id,
          name: c.name || 'Sin nombre',
          sort_order: 0,
          dishes: c.dishes.map((d) => ({
            id: d.id,
            category_id: c.id,
            name: d.name || 'Plato',
            description: d.description || null,
            price: Number(d.price) || 0,
            image_url: d.image || null,
            sort_order: 0,
          })),
        })),
      };
      setPreviewHtml(buildMenuHTML(data));
    }, 400);
    return () => clearTimeout(timer);
  }, [menu, categories, plan, initialMenu.id, initialMenu.slug, profile.id]);

  async function handlePublish() {
    setPublishing(true);
    try {
      // Validaciones
      if (!menu.name.trim()) {
        toast.error('Ingresa el nombre del restaurante');
        return;
      }
      if (!menu.whatsapp.trim() || !/^\d{8,15}$/.test(menu.whatsapp)) {
        toast.error('WhatsApp inválido. 8-15 dígitos sin + ni espacios');
        return;
      }
      const validCats = categories.filter((c) => c.name.trim());
      if (validCats.length === 0) {
        toast.error('Agrega al menos una categoría con nombre');
        return;
      }
      for (const c of validCats) {
        const validDishes = c.dishes.filter((d) => d.name.trim());
        if (validDishes.length === 0) {
          toast.error(`La categoría "${c.name}" necesita al menos un plato`);
          return;
        }
        for (const d of validDishes) {
          if (!d.price || isNaN(Number(d.price)) || Number(d.price) < 0) {
            toast.error(`Precio inválido en: ${d.name}`);
            return;
          }
        }
      }

      // Guardar primero
      const res = await fetch(`/api/menus/${initialMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...menu,
          is_published: true,
          categories: categories.map((c) => ({
            name: c.name,
            dishes: c.dishes.map((d) => ({
              name: d.name,
              description: d.description,
              price: d.price,
              image_url: d.image,
            })),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }
      setMenu((m) => ({ ...m, is_published: true }));
      dirtyRef.current = false;
      toast.success('¡Menú publicado! Ya es visible públicamente.');
      window.open(`/r/${initialMenu.slug}`, '_blank');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setPublishing(false);
    }
  }

  function addCategory() {
    setCategories((cs) => [
      ...cs,
      {
        id: `new-${Date.now()}`,
        name: '',
        dishes: [{ id: `d-${Date.now()}`, name: '', description: '', price: '', image: '' }],
      },
    ]);
  }

  function addDish(catId: string) {
    setCategories((cs) =>
      cs.map((c) =>
        c.id === catId
          ? {
              ...c,
              dishes: [...c.dishes, { id: `d-${Date.now()}`, name: '', description: '', price: '', image: '' }],
            }
          : c
      )
    );
  }

  function removeCategory(catId: string) {
    setCategories((cs) => cs.filter((c) => c.id !== catId));
  }

  function removeDish(catId: string, dishId: string) {
    setCategories((cs) =>
      cs.map((c) =>
        c.id === catId
          ? { ...c, dishes: c.dishes.filter((d) => d.id !== dishId) }
          : c
      )
    );
  }

  function updateCategory(catId: string, name: string) {
    setCategories((cs) => cs.map((c) => (c.id === catId ? { ...c, name } : c)));
  }

  function updateDish(catId: string, dishId: string, field: keyof LocalDish, value: string) {
    setCategories((cs) =>
      cs.map((c) =>
        c.id === catId
          ? { ...c, dishes: c.dishes.map((d) => (d.id === dishId ? { ...d, [field]: value } : d)) }
          : c
      )
    );
  }

  function handleLogoUploaded(url: string) {
    setMenu((m) => ({ ...m, logo: url }));
  }

  function handleDishImageUploaded(catId: string, dishId: string, url: string) {
    updateDish(catId, dishId, 'image', url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/menus/${initialMenu.id}/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error importando');
      toast.success(data.message || `Importados: ${data.imported?.categories} categorías, ${data.imported?.dishes} platos`);
      router.refresh();
      // Reload menu data from server
      const menuRes = await fetch(`/api/menus/${initialMenu.id}`);
      const menuData = await menuRes.json();
      if (menuData.menu) {
        const m = menuData.menu;
        setMenu({
          name: m.name || '',
          slogan: m.slogan || '',
          description: m.description || '',
          whatsapp: m.whatsapp || '',
          logo: m.logo_url || '',
          color: m.color || '#ff6b35',
          currency: m.currency || 'S/',
          is_published: m.is_published || false,
        });
        setCategories(
          (m.categories || []).map((c: { id: string; name: string; dishes?: Array<{ id: string; name: string; description: string; price: number; image_url: string }> }) => ({
            id: c.id,
            name: c.name,
            dishes: (c.dishes || []).map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description || '',
              price: String(d.price),
              image: d.image_url || '',
            })),
          }))
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  }

  async function handleExportMenu(format: string) {
    try {
      const res = await fetch(`/api/menus/${initialMenu.id}/export?format=${format}`);
      if (!res.ok) throw new Error('Error exportando');
      const blob = await res.blob();
      const ext = format === 'excel' ? 'xls' : format === 'word' ? 'doc' : format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (menu.name || 'menu').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, '').replace(/\s+/g, '-');
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

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#0a0a14] backdrop-blur sticky top-0 z-40">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/dashboard" className="text-white/60 hover:text-white flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="min-w-0">
              <div className="font-semibold truncate">{menu.name || 'Sin nombre'}</div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                {saving ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Guardando...</>
                ) : savedAt ? (
                  <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Guardado {savedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</>
                ) : (
                  'Auto-guardado activo'
                )}
                {menu.is_published && (
                  <span className="text-emerald-400">· Publicado</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => save(false)}
              disabled={saving}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              <Save className="w-4 h-4" />
              <span className="hidden md:inline">Guardar</span>
            </Button>
            {menu.is_published && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-white/70 hover:text-white hover:bg-white/5"
              >
                <a href={`/r/${initialMenu.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4" />
                  <span className="hidden md:inline">Ver público</span>
                </a>
              </Button>
            )}
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90"
            >
              {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {menu.is_published ? 'Actualizar' : 'Publicar'}
            </Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0 max-w-[1600px] mx-auto">
        {/* Form pane */}
        <section className="p-6 space-y-6 lg:max-h-[calc(100vh-65px)] lg:overflow-y-auto">
          {/* Info card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-sm font-bold text-[#1a1a2e]">
                1
              </div>
              <h2 className="font-semibold">Información del restaurante</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre del restaurante *</Label>
                <Input
                  value={menu.name}
                  onChange={(e) => setMenu({ ...menu, name: e.target.value })}
                  placeholder="Ej: La Parrilla del Chef"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Slogan</Label>
                <Input
                  value={menu.slogan}
                  onChange={(e) => setMenu({ ...menu, slogan: e.target.value })}
                  placeholder="Ej: Cocina de autor desde 1998"
                  maxLength={60}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={menu.description}
                  onChange={(e) => setMenu({ ...menu, description: e.target.value })}
                  placeholder="Ej: Auténtica cocina peruana con ingredientes frescos"
                  className="bg-white/5 border-white/10 text-white min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>WhatsApp con código de país *</Label>
                <Input
                  value={menu.whatsapp}
                  onChange={(e) => setMenu({ ...menu, whatsapp: e.target.value.replace(/\D/g, '') })}
                  placeholder="51987654321"
                  className="bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-white/40">
                  Solo dígitos. 51=Perú, 52=México, 57=Colombia, 54=Argentina
                </p>
              </div>

              <div className="space-y-2">
                <Label>Logo del restaurante</Label>
                <ImageUploader
                  initialUrl={menu.logo}
                  onUploaded={handleLogoUploaded}
                  plan={plan}
                  imagesCount={imagesCount}
                  shape="circle"
                  size={120}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select
                    value={menu.currency}
                    onValueChange={(v) => setMenu({ ...menu, currency: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15152a] border-white/10">
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-white">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color principal</Label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setMenu({ ...menu, color: c.hex })}
                        className={`aspect-square rounded-lg transition-all ${
                          menu.color === c.hex
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#07070b] scale-105'
                            : 'hover:scale-110'
                        }`}
                        style={{ background: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Categories card */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-sm font-bold text-[#1a1a2e]">
                2
              </div>
              <h2 className="font-semibold">Categorías y platos</h2>
              <div className="ml-auto flex items-center gap-2">
                <input ref={importFileRef} type="file" accept=".json,.csv,.xls,.xlsx" className="hidden" onChange={handleImport} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => importFileRef.current?.click()}
                  disabled={importing}
                  className="text-white/60 hover:text-white hover:bg-white/5 text-xs"
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                  Importar
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5 text-xs">
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#15152a] border-white/10">
                    <DropdownMenuItem onClick={() => handleExportMenu('json')} className="text-white focus:bg-white/5">JSON</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportMenu('csv')} className="text-white focus:bg-white/5">CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportMenu('excel')} className="text-white focus:bg-white/5">Excel (.xls)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportMenu('word')} className="text-white focus:bg-white/5">Word (.doc)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {importing && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 text-sm text-[#d4af37]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Importando platos desde archivo...
              </div>
            )}

            <div className="space-y-4">
              {categories.map((cat, ci) => (
                <div
                  key={cat.id}
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Input
                      value={cat.name}
                      onChange={(e) => updateCategory(cat.id, e.target.value)}
                      placeholder={`Categoría ${ci + 1} (Ej: Entradas)`}
                      className="bg-white/5 border-white/10 text-white font-semibold"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCategory(cat.id)}
                      className="text-white/40 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {cat.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className="grid grid-cols-[64px_1fr] gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-lg"
                      >
                        <ImageUploader
                          initialUrl={dish.image}
                          onUploaded={(url) => handleDishImageUploaded(cat.id, dish.id, url)}
                          plan={plan}
                          imagesCount={imagesCount}
                          shape="square"
                          size={64}
                        />
                        <div className="space-y-2 min-w-0">
                          <Input
                            value={dish.name}
                            onChange={(e) => updateDish(cat.id, dish.id, 'name', e.target.value)}
                            placeholder="Nombre del plato"
                            className="bg-white/5 border-white/10 text-white h-9"
                          />
                          <Input
                            value={dish.description}
                            onChange={(e) => updateDish(cat.id, dish.id, 'description', e.target.value)}
                            placeholder="Descripción (opcional)"
                            className="bg-white/5 border-white/10 text-white h-9"
                          />
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40 font-semibold">
                                {menu.currency}
                              </span>
                              <Input
                                type="number"
                                step="0.10"
                                min="0"
                                value={dish.price}
                                onChange={(e) => updateDish(cat.id, dish.id, 'price', e.target.value)}
                                placeholder="0.00"
                                className="bg-white/5 border-white/10 text-white h-9 pl-10"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeDish(cat.id, dish.id)}
                              className="text-white/40 hover:text-red-400 hover:bg-red-500/10 h-9 w-9"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addDish(cat.id)}
                      className="w-full text-[#d4af37] hover:text-[#d4af37] hover:bg-[#d4af37]/10 border border-dashed border-[#d4af37]/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar plato
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="ghost"
                size="sm"
                onClick={addCategory}
                className="w-full text-[#d4af37] hover:text-[#d4af37] hover:bg-[#d4af37]/10 border border-dashed border-[#d4af37]/40"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar categoría
              </Button>
            </div>
          </div>
        </section>

        {/* Preview pane */}
        <aside className="border-l border-white/10 bg-[#0a0a14] lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white/70">Vista previa</span>
            </div>
            <span className="text-xs text-white/40">Mobile</span>
          </div>
          <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 relative">
            <iframe
              srcDoc={previewHtml}
              title="Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
          {plan.limits.hasBranding && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs text-[#d4af37] text-center">
              Visible con marca "Creado con MenuPro" · Upgrade a Pro para quitarla
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
