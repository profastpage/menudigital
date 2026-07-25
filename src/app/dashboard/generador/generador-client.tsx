'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Download,
  Loader2,
  ExternalLink,
  Sparkles,
  FileCode2,
} from 'lucide-react';
import type { Plan } from '@/lib/plans';
import { PLANS } from '@/lib/plans';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

interface Props {
  user: { email: string; name: string };
  isSuperAdmin?: boolean;
  profilePlan?: string;
}

/**
 * Generador integrado.
 * Carga el `generador.html` standalone dentro de un iframe.
 */
export function GeneradorClient({ user, isSuperAdmin = false, profilePlan = 'free' }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [importing, setImporting] = useState(false);
  const [canImport, setCanImport] = useState(false);
  const [pendingHtml, setPendingHtml] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string>('');

  const plan = PLANS[profilePlan as keyof typeof PLANS] || PLANS.free;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'menupro:html-ready' && typeof data.html === 'string') {
        setPendingHtml(data.html);
        setPendingName(data.name || 'Menú importado');
        setCanImport(true);
        toast.success('Menú generado. ¿Lo guardamos en tu cuenta?', {
          duration: 6000,
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  async function handleImportToAccount() {
    if (!pendingHtml) return;
    setImporting(true);
    try {
      const match = pendingHtml.match(
        /var\s+RESTAURANT\s*=\s*(\{[\s\S]*?\});/
      );
      if (!match) {
        throw new Error(
          'No se pudo extraer la data del menú generado. Verifica que el HTML sea válido.'
        );
      }
      const restaurantData = JSON.parse(match[1]);

      const createRes = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantData.name || pendingName,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || 'Error creando menú');
      }
      const menuId = createData.menu.id;

      const updateRes = await fetch(`/api/menus/${menuId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantData.name || pendingName,
          slogan: restaurantData.slogan || '',
          description: restaurantData.description || '',
          whatsapp: restaurantData.whatsapp || '',
          logo: restaurantData.logo || '',
          color: restaurantData.color || '#ff6b35',
          currency: restaurantData.currency || 'S/',
          is_published: false,
          categories: (restaurantData.categories || []).map((c: any) => ({
            name: c.name || 'Sin nombre',
            dishes: (c.dishes || []).map((d: any) => ({
              name: d.name || '',
              description: d.description || '',
              price: String(d.price || 0),
              image_url: d.image || '',
            })),
          })),
        }),
      });
      if (!updateRes.ok) {
        const err = await updateRes.json();
        throw new Error(err.error || 'Error guardando contenido del menú');
      }

      toast.success('¡Menú importado a tu cuenta!');
      setCanImport(false);
      setPendingHtml(null);
      router.push(`/dashboard/${menuId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al importar');
    } finally {
      setImporting(false);
    }
  }

  function handleDownloadStandalone() {
    if (!pendingHtml) return;
    const blob = new Blob([pendingHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (pendingName || 'menu')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.download = `menu-${safeName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast.success('HTML descargado');
  }

  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4af37]" />
            Generador Premium
          </h1>
          <p className="text-white/60 text-xs sm:text-sm">
            Diseña tu menú y guárdalo en tu cuenta o descárgalo como HTML
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/menu-ejemplo.html"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ver ejemplo</span>
          </a>
          {canImport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadStandalone}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-9"
              >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Descargar HTML</span>
              </Button>
              <Button
                size="sm"
                onClick={handleImportToAccount}
                disabled={importing}
                className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90 h-9"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCode2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {importing ? 'Importando…' : 'Guardar en mi cuenta'}
                </span>
                <span className="sm:hidden">
                  {importing ? '…' : 'Guardar'}
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Iframe con el generador standalone */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <iframe
          ref={iframeRef}
          src="/generador.html"
          title="Generador Premium"
          className="w-full border-0"
          style={{ minHeight: 'calc(100vh - 220px)' }}
        />
      </div>
    </DashboardShell>
  );
}
