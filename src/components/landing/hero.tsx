'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Decorative orbs */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: '#d4af37' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: '#9d4edd' }}
      />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="text-xs font-semibold text-[#d4af37] tracking-wide">
              MENÚS DIGITALES PROFESIONALES
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] mb-6 tracking-tight">
            Menús digitales
            <br />
            <span className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] bg-clip-text text-transparent">
              que venden más
            </span>
          </h1>

          <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
            Crea tu carta digital con carrito integrado de WhatsApp en menos de
            5 minutos. Sin comisiones por venta. Sin contratos. Hecho en Perú
            para restaurantes peruanos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold hover:opacity-90 transition shadow-lg shadow-[#d4af37]/20"
            >
              Crear mi menú gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl border border-white/15 text-white hover:bg-white/5 transition"
            >
              Ver precios
            </a>
          </div>

          <div className="flex items-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Cancelas cuando quieras
            </div>
          </div>
        </motion.div>

        {/* Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative max-w-[340px] mx-auto">
            {/* Phone frame */}
            <div className="relative bg-[#0a0a14] rounded-[2.5rem] border-4 border-[#1a1a2e] shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-b from-[#0f0f1a] to-[#0a0a14] p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d35e] mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-[#1a1a2e]">
                  L
                </div>
                <div className="font-bold text-lg">La Parrilla</div>
                <div className="text-[10px] text-[#d4af37] tracking-widest uppercase mt-1">
                  Cocina de autor
                </div>
                <div className="inline-block mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Abierto ahora
                </div>
              </div>
              <div className="bg-[#0a0a14] p-4 space-y-3">
                {[
                  { name: 'Ceviche Clásico', desc: 'Pescado fresco, ají limo', price: 'S/ 28.00' },
                  { name: 'Lomo Saltado', desc: 'Salteado de res, papas fritas', price: 'S/ 35.00' },
                  { name: 'Ají de Gallina', desc: 'Crema de ají amarillo', price: 'S/ 30.00' },
                ].map((d, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/10 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{d.name}</div>
                      <div className="text-xs text-white/50 truncate">{d.desc}</div>
                      <div className="text-[#d4af37] font-bold text-sm mt-0.5">{d.price}</div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#d4af37] flex items-center justify-center text-[#1a1a2e] font-bold">
                      +
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] p-3 m-3 rounded-xl flex items-center justify-between">
                <div className="text-[#1a1a2e] font-semibold text-sm">
                  Ver pedido · 3 items
                </div>
                <div className="text-[#1a1a2e] font-bold">S/ 93.00</div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="absolute -left-6 top-1/3 bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl hidden md:block"
          >
            <div className="text-[10px] text-white/50 mb-1">Visitas hoy</div>
            <div className="text-2xl font-bold text-[#d4af37]">+147</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute -right-6 bottom-1/4 bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl hidden md:block"
          >
            <div className="text-[10px] text-white/50 mb-1">Pedidos WhatsApp</div>
            <div className="text-2xl font-bold text-emerald-400">+12</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
