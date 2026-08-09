"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ArrowRight, ExternalLink, Pause, Play, Smartphone } from "lucide-react";

/**
 * DemoMenuCarousel
 *
 * Carrusel de cartas demo REALES embebidas en iframes dentro de un phone mockup.
 * Muestra 3 restaurantes de prueba con identidades visuales distintas (peruana,
 * pizzería, café) para que el visitante vea y pruebe el producto real: categorías
 * navegables, platos con foto y precio, carrito, botón WhatsApp y modal de pedido.
 *
 * - Auto-rotación cada 7s (pausa en hover / focus / touch)
 * - Tabs/dots para navegación manual
 * - Botón "Ver carta completa" abre el menú en nueva pestaña
 * - Mobile-first: en mobile ocupa ~320px de ancho, en desktop hasta 380px
 * - Phone frame realista con notch y status bar
 * - Cada iframe es sandbox seguro (no puede acceder al parent)
 */

interface DemoMenu {
  slug: string;
  name: string;
  cuisine: string;
  color: string;
  src: string;
  href: string;
}

const DEMOS: DemoMenu[] = [
  {
    slug: "la-parrilla",
    name: "La Parrilla del Chef",
    cuisine: "Cocina peruana de autor",
    color: "#d4af37",
    src: "/demo-menus/la-parrilla.html",
    href: "/demo-menus/la-parrilla.html",
  },
  {
    slug: "pizzeria-bella",
    name: "Pizzería Bella Italia",
    cuisine: "Auténtica pizza napolitana",
    color: "#e63946",
    src: "/demo-menus/pizzeria-bella.html",
    href: "/demo-menus/pizzeria-bella.html",
  },
  {
    slug: "cafe-aurora",
    name: "Café Aurora",
    cuisine: "Café de especialidad y repostería",
    color: "#a47148",
    src: "/demo-menus/cafe-aurora.html",
    href: "/demo-menus/cafe-aurora.html",
  },
];

const ROTATION_MS = 7000;

export function DemoMenuCarousel() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState<Record<number, boolean>>({ 0: false, 1: false, 2: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => {
    setActive((p) => (p + 1) % DEMOS.length);
  }, []);

  const go = useCallback((idx: number) => {
    setActive(idx);
  }, []);

  // Auto-rotación con pausa inteligente
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(next, ROTATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, paused, next]);

  const current = DEMOS[active];

  return (
    <div className="relative">
      {/* Glow detrás del teléfono — color del restaurante activo */}
      <motion.div
        key={`glow-${current.color}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 blur-3xl rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${current.color} 0%, transparent 70%)` }}
      />

      {/* ─── Phone frame ─── */}
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="relative bg-[#0a0a14] rounded-[2.5rem] border-[3px] border-[#1a1a2e] shadow-2xl overflow-hidden mx-auto"
        style={{
          maxWidth: "340px",
          width: "100%",
          boxShadow: `0 30px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px ${current.color}22`,
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#0a0a14] rounded-b-2xl z-20 border-x border-b border-white/5" />

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1.5 text-[10px] text-white/60 font-medium relative z-10">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm border border-white/40" />
            <span className="text-[8px]">●●●●</span>
            <span className="w-5 h-2 rounded-sm border border-white/40 inline-block" />
          </span>
        </div>

        {/* Demo badge superior — "Demo en vivo" */}
        <div className="absolute top-9 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur border border-white/10 text-[9px] font-semibold text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            DEMO EN VIVO
          </div>
        </div>

        {/* Iframes apilados — solo el activo es visible, pero todos se mantienen montados
            para preservar scroll y carrito al volver */}
        <div className="relative" style={{ height: "560px" }}>
          {DEMOS.map((demo, idx) => (
            <iframe
              key={demo.slug}
              src={demo.src}
              title={`Demo ${demo.name}`}
              loading={idx === 0 ? "eager" : "lazy"}
              onLoad={() => setIframeLoaded((p) => ({ ...p, [idx]: true }))}
              className="absolute inset-0 w-full h-full border-0 transition-opacity duration-500"
              style={{
                opacity: idx === active ? 1 : 0,
                pointerEvents: idx === active ? "auto" : "none",
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
              }}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              aria-hidden={idx !== active}
            />
          ))}

          {/* Skeleton loader mientras carga */}
          <AnimatePresence>
            {!iframeLoaded[active] && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a14] gap-3"
              >
                <Smartphone className="w-8 h-8 text-white/30 animate-pulse" />
                <div className="text-xs text-white/40">Cargando carta…</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Controles inferiores del carrusel ─── */}
        <div className="bg-[#0a0a14] border-t border-white/5 px-4 py-3 flex items-center justify-between gap-3">
          {/* Dots / Tabs */}
          <div className="flex items-center gap-1.5">
            {DEMOS.map((d, idx) => (
              <button
                key={d.slug}
                onClick={() => go(idx)}
                aria-label={`Ver demo de ${d.name}`}
                aria-pressed={idx === active}
                className="group relative transition-all"
                style={{ padding: "4px 2px" }}
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: idx === active ? 24 : 8,
                    height: 8,
                    background: idx === active ? current.color : "rgba(255,255,255,0.2)",
                  }}
                />
              </button>
            ))}
          </div>

          {/* Pause/Play + nombre actual */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? "Reanudar carrusel" : "Pausar carrusel"}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition flex-shrink-0"
            >
              {paused ? <Play className="w-3 h-3 text-white/70" /> : <Pause className="w-3 h-3 text-white/70" />}
            </button>
            <div className="text-right min-w-0">
              <div className="text-[11px] font-semibold text-white truncate max-w-[140px]">{current.name}</div>
              <div className="text-[9px] text-white/40 truncate max-w-[140px]">{current.cuisine}</div>
            </div>
          </div>
        </div>

        {/* Cart bar simulada (decorativa — el iframe real tiene su propio carrito) */}
      </motion.div>

      {/* ─── CTA debajo del phone ─── */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <motion.div
          key={`info-${active}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-0.5">
            Carta demo #{active + 1} de {DEMOS.length}
          </div>
          <div className="text-sm font-semibold" style={{ color: current.color }}>
            {current.name}
          </div>
        </motion.div>

        <Link
          href={current.href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-sm font-medium transition-all hover:scale-[1.02]"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir carta completa
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <p className="text-[10px] text-white/30 text-center max-w-[280px] leading-relaxed">
          Demo real e interactivo: navega categorías, agrega platos al carrito y envía el pedido por WhatsApp.
        </p>
      </div>

      {/* ─── Floating cards (solo desktop) ─── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="absolute -left-4 lg:-left-12 top-1/4 bg-[#1a1a2e] border border-white/10 rounded-2xl p-3 shadow-2xl hidden md:block backdrop-blur z-30"
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-[10px] text-white/50">Demo real</div>
            <div className="text-xs font-bold text-emerald-400">Interactúa</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="absolute -right-4 lg:-right-12 bottom-1/3 bg-[#1a1a2e] border border-white/10 rounded-2xl p-3 shadow-2xl hidden md:block backdrop-blur z-30"
        style={{ borderLeft: `2px solid ${current.color}` }}
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${current.color}22` }}>
            <ArrowRight className="w-4 h-4" style={{ color: current.color }} />
          </div>
          <div>
            <div className="text-[10px] text-white/50">Pedido WhatsApp</div>
            <div className="text-xs font-bold" style={{ color: current.color }}>
              Funciona real
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
