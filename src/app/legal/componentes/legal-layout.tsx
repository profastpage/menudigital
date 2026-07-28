import Link from "next/link";
import type { ReactNode } from "react";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  description?: string;
  children: ReactNode;
}

/**
 * Layout reutilizable para todas las páginas legales.
 * Estilo limpio, tipografía legible, fondo claro (no el tema oscuro del landing).
 * Pensado para imprimir / compartir fácilmente con clientes y abogados.
 */
export function LegalLayout({ title, lastUpdated, description, children }: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header simple */}
      <header className="border-b border-gray-200 sticky top-0 z-10 bg-white/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <picture>
              <source srcSet="/logo-192.webp" type="image/webp" />
              <img
                src="/logo-192.png"
                alt="MenuPro"
                width={32}
                height={32}
                className="rounded-lg"
                style={{ width: 32, height: 32 }}
              />
            </picture>
            <span className="font-bold text-gray-900">MenuPro</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link href="/legal/terminos" className="hover:text-gray-900">
              Términos
            </Link>
            <Link href="/legal/privacidad" className="hover:text-gray-900">
              Privacidad
            </Link>
            <Link href="/legal/reembolsos" className="hover:text-gray-900">
              Reembolsos
            </Link>
          </nav>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-6 py-12">
        <header className="mb-10 pb-8 border-b border-gray-200">
          <h1 className="text-4xl font-bold tracking-tight mb-3">{title}</h1>
          {description && (
            <p className="text-lg text-gray-600 leading-relaxed">{description}</p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            Última actualización: {lastUpdated}
          </p>
        </header>

        <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-a:text-[#d4af37] prose-a:no-underline hover:prose-a:underline prose-li:my-1 prose-strong:text-gray-900">
          {children}
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-sm text-gray-500">
          <p>
            ¿Dudas sobre este documento? Escríbenos a{" "}
            <a
              href="mailto:legal@menudigital.pro"
              className="text-[#d4af37] font-medium hover:underline"
            >
              legal@menudigital.pro
            </a>{" "}
            o por WhatsApp al{" "}
            <a
              href="https://wa.me/51933667414"
              target="_blank"
              rel="noreferrer"
              className="text-[#d4af37] font-medium hover:underline"
            >
              +51 933 667 414
            </a>
            .
          </p>
          <p className="mt-4">
            © {new Date().getFullYear()} MenuPro. Todos los derechos reservados.
          </p>
        </footer>
      </article>
    </main>
  );
}
