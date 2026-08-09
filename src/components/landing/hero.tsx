"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, Star, TrendingUp, ShoppingBag } from "lucide-react";
import { DemoMenuCarousel } from "@/components/landing/demo-menu-carousel";

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden pt-24 pb-20 md:pt-28 md:pb-32">
      {/* Decorative gradient orbs — animados */}
      <motion.div
        animate={reduce ? undefined : { x: [0, 30, 0], y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #d4af37 0%, transparent 70%)" }}
      />
      <motion.div
        animate={reduce ? undefined : { x: [0, -30, 0], y: [0, 30, 0], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #9d4edd 0%, transparent 70%)" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        {/* ─── IZQUIERDA: Copy + CTAs ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37]/15 to-[#f4d35e]/10 border border-[#d4af37]/40 mb-6 backdrop-blur-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-xs font-semibold text-[#d4af37] tracking-wide">
              MENÚS DIGITALES PROFESIONALES
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl xs:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5 tracking-tight break-words">
            Menús digitales
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#d4af37] via-[#f4d35e] to-[#d4af37] bg-clip-text text-transparent">
                que venden más
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#d4af37] to-[#f4d35e] rounded-full origin-left"
              />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed">
            Tu carta digital con carrito de WhatsApp en 5 minutos. Sin comisiones, sin contratos.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-bold hover:shadow-2xl hover:shadow-[#d4af37]/30 transition-all"
              >
                Crear mi menú gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/30 transition font-medium"
              >
                Ver precios
              </a>
            </motion.div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Cancelas cuando quieras
            </div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 max-w-md"
          >
            <Stat value="+500" label="Restaurantes" />
            <Stat value="+50k" label="Pedidos WhatsApp" />
            <Stat value="4.9★" label="Rating promedio" />
          </motion.div>
        </motion.div>

        {/* ─── DERECHA: Carrusel de cartas demo REALES ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <DemoMenuCarousel />

          {/* Top floating — rating */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="absolute -top-3 right-6 bg-[#1a1a2e] border border-white/10 rounded-full px-3 py-1.5 shadow-2xl hidden md:flex items-center gap-1.5 backdrop-blur z-30"
          >
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d35e] border border-[#1a1a2e] text-[8px] flex items-center justify-center font-bold text-[#1a1a2e]"
                >
                  {["L", "M", "P"][i - 1]}
                </div>
              ))}
            </div>
            <span className="text-xs text-white/80 font-medium">
              <span className="text-[#d4af37] font-bold">4.9</span> · 320 reseñas
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-white/50 mt-0.5">{label}</div>
    </div>
  );
}
