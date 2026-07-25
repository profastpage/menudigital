'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  Loader2,
  ExternalLink,
  Sparkles,
  FileCode2,
} from 'lucide-react';

interface Props {
  user: { email: string; name: string };
}

/**
 * Generador integrado.
 *
 * Carga el `generador.html` standalone (servido desde /public/generador.html)
 * dentro de un iframe. El usuario puede:
 *   - Diseñar su menú con la UI premium del generador
 *   - Generar y descargar el HTML standalone (botón "Generar" dentro del iframe)
 *   - O importar el HTML generado directamente como un menú nuevo en su cuenta
 *
 * Comunicación iframe → parent via window.postMessage:
 *   { type: 'menupro:html-ready', html: string, name: string }
 *   → el parent recibe el HTML y lo guarda como un menú nuevo via API.
 */
export function GeneradorClient({ user }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [importing, setImporting] = useState(false);
  const [canImport, setCanImport] = useState(false);
  const [pendingHtml, setPendingHtml] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string>('');

  // Escuchar mensajes del iframe cuando el HTML está listo para importar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (event: MessageEvent) => {
      // Verificar origen — el iframe carga desde el mismo dominio
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

  /**
   * Importa el HTML generado como un menú nuevo en la cuenta del usuario.
   * El HTML standalone incluye un objeto JSON `RESTAURANT` con todos los datos.
   * Extraemos esa data y la enviamos a /api/menus para crear el menú.
   */
  async function handleImportToAccount() {
    if (!pendingHtml) return;
    setImporting(true);
    try {
      // Extraer el objeto RESTAURANT del HTML
      const match = pendingHtml.match(
        /var\s+RESTAURANT\s*=\s*(\{[\s\S]*?\});/
      );
      if (!match) {
        throw new Error(
          'No se pudo extraer la data del menú generado. Verifica que el HTML sea válido.'
        );
      }
      const restaurantData = JSON.parse(match[1]);

      // Crear el menú via API
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
      const slug = createData.menu.slug;

      // Actualizar el menú con toda la data del generador
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
    <div className="min-h-screen bg-[#07070b] text-white flex flex-col">
      {/* Top bar */}
      <header className="border-b border-white/10 bg-[#0a0a14] backdrop-blur sticky top-0 z-40">
        <div className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href="/dashboard"
              className="text-white/60 hover:text-white flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                Generador Premium
              </div>
              <div className="text-xs text-white/40">
                Diseña tu menú y guárdalo en tu cuenta o descárgalo como HTML
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canImport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadStandalone}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden md:inline">Descargar HTML</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleImportToAccount}
                  disabled={importing}
                  className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileCode2 className="w-4 h-4" />
                  )}
                  <span className="hidden md:inline">
                    {importing ? 'Importando…' : 'Guardar en mi cuenta'}
                  </span>
                </Button>
              </>
            )}
            <a
              href="/menu-ejemplo.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs text-white/60 hover:text-white border border-white/10 hover:bg-white/5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ver ejemplo</span>
            </a>
          </div>
        </div>
      </header>

      {/* Iframe con el generador standalone */}
      <iframe
        ref={iframeRef}
        src="/generador.html"
        title="Generador Premium"
        className="flex-1 w-full border-0"
        style={{ minHeight: 'calc(100vh - 65px)' }}
      />
    </div>
  );
}
