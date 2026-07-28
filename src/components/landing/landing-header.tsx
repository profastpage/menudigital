"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#comparativa", label: "Comparativa" },
  { href: "#pricing", label: "Precios" },
  { href: "#testimonios", label: "Testimonios" },
  { href: "#faq", label: "FAQ" },
];

/**
 * Header de la landing — rediseñado con:
 * - Logo limpio (sin doble <picture> anidado)
 * - Nav desktop con links accesibles (texto plata, hover blanco)
 * - Menú mobile hamburguesa (sheet deslizable desde la derecha)
 * - Botones "Iniciar sesión" y "Empezar gratis" en estilo glassmorphism elegante
 *   (reemplazo del dorado que se veía común y barato)
 * - Border-bottom sutil + backdrop-blur para efecto premium
 * - Smooth scroll a anchors
 */
export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Sombra/border más fuerte al hacer scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquear scroll del body cuando el menú mobile está abierto
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Cerrar menú mobile con ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? "bg-[#07070b]/85 border-b border-white/10 shadow-lg shadow-black/40"
          : "bg-[#07070b]/60 border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* ─── Logo ─── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
          <picture>
            <source srcSet="/logo-192.webp" type="image/webp" />
            <img
              src="/logo-192.png"
              alt="MenuPro"
              width={36}
              height={36}
              className="rounded-lg shadow-lg shadow-white/10 transition-transform group-hover:scale-105"
              style={{ width: 36, height: 36 }}
            />
          </picture>
          <span className="font-bold text-lg tracking-tight">MenuPro</span>
        </Link>

        {/* ─── Nav desktop ─── */}
        <nav className="hidden md:flex items-center gap-7 text-sm text-white/65 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors relative py-1.5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* ─── CTA desktop (glassmorphism elegante) ─── */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="text-sm text-white/85 hover:text-white px-4 py-2 rounded-lg bg-white/5 border border-white/15 hover:bg-white/15 hover:border-white/30 transition-all font-semibold"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-sm font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#0a0a14] hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20"
          >
            Empezar gratis
          </Link>
        </div>

        {/* ─── CTA mobile (solo "Empezar gratis", el login va en el menú) ─── */}
        <div className="md:hidden flex items-center gap-2 flex-shrink-0">
          <Link
            href="/login"
            className="text-xs font-bold px-3.5 py-2 rounded-lg bg-white/10 border border-white/25 text-white hover:bg-white/20 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="text-xs font-bold px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#0a0a14] hover:opacity-90 transition-opacity shadow-md shadow-amber-500/20"
          >
            Empezar gratis
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-white transition-colors border border-white/15"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─── Menú mobile (overlay) ─── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sheet deslizable desde la derecha */}
          <div className="absolute top-0 right-0 bottom-0 w-[280px] max-w-[85vw] bg-[#0a0a14] border-l border-white/10 flex flex-col shadow-2xl">
            {/* Header del sheet */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <span className="font-bold text-base">Menú</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links de navegación */}
            <nav className="flex-1 overflow-y-auto py-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-3.5 text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <span className="text-sm font-medium">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </a>
              ))}
            </nav>

            {/* CTAs en el footer del sheet — fondo sólido para contraste */}
            <div className="p-4 border-t border-white/10 space-y-2.5 bg-black/30">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-3.5 rounded-xl bg-white/10 text-white border border-white/30 hover:bg-white/20 hover:border-white/50 transition-colors text-sm font-bold shadow-md shadow-black/30"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#0a0a14] hover:opacity-95 active:scale-[0.98] transition-all text-sm font-extrabold shadow-lg shadow-amber-500/30"
              >
                Empezar gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
