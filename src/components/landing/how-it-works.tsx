"use client";

import { motion } from "framer-motion";
import { UserPlus, Edit3, Share2, TrendingUp } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: UserPlus,
    title: "Crea tu cuenta",
    desc: "Regístrate gratis con email o Google. Sin tarjeta de crédito. En 30 segundos estás dentro del panel.",
    accent: "#d4af37",
    duration: "30 seg",
  },
  {
    num: "02",
    icon: Edit3,
    title: "Diseña tu menú",
    desc: "Agrega categorías, platos, precios e imágenes. Vista previa en vivo mientras editas. Arrastra y suelta para reordenar.",
    accent: "#9d4edd",
    duration: "2-5 min",
  },
  {
    num: "03",
    icon: Share2,
    title: "Publica y comparte",
    desc: "Obtén tu URL única y código QR. Compártelo en redes, imprímelo en mesas, ponlo en tus flyers. Todo desde un solo lugar.",
    accent: "#06d6a0",
    duration: "1 min",
  },
  {
    num: "04",
    icon: TrendingUp,
    title: "Vende más",
    desc: "Recibe pedidos por WhatsApp directo. Mide qué platos funcionan mejor con analytics. Itera y crece.",
    accent: "#e63946",
    duration: "Para siempre",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#9d4edd]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9d4edd]/10 border border-[#9d4edd]/30 text-xs font-semibold text-[#9d4edd] tracking-wider mb-4">
              SIMPLE Y RÁPIDO
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              En 4 pasos
              <span className="bg-gradient-to-r from-[#9d4edd] to-[#d4af37] bg-clip-text text-transparent">
                {" "}estás vendiendo
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              De cero a menú publicado en menos de 5 minutos. Sin curva de aprendizaje.
            </p>
          </motion.div>
        </div>

        {/* Timeline vertical en móvil, horizontal en desktop */}
        <div className="relative">
          {/* Línea conectora — desktop */}
          <div className="hidden lg:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                {/* Icon circle */}
                <div className="relative mb-6 flex justify-center lg:justify-start">
                  <div className="relative">
                    {/* Glow */}
                    <div
                      className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                      style={{ background: s.accent }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="relative w-16 h-16 rounded-2xl flex items-center justify-center border-2"
                      style={{
                        background: `${s.accent}15`,
                        borderColor: `${s.accent}50`,
                        boxShadow: `0 8px 24px -8px ${s.accent}40`,
                      }}
                    >
                      <s.icon className="w-7 h-7" style={{ color: s.accent }} />
                    </motion.div>
                    {/* Step number badge */}
                    <div
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#07070b]"
                      style={{ background: s.accent, color: "#07070b" }}
                    >
                      {i + 1}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-center lg:text-left">
                  <div
                    className="text-xs font-bold tracking-widest mb-2"
                    style={{ color: s.accent }}
                  >
                    PASO {s.num}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-3">{s.desc}</p>

                  {/* Duration badge */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border"
                    style={{
                      background: `${s.accent}10`,
                      borderColor: `${s.accent}30`,
                      color: s.accent,
                    }}
                  >
                    ⏱ {s.duration}
                  </span>
                </div>

                {/* Arrow connector — desktop */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-2 text-white/20">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA inferior */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-16"
        >
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-bold hover:shadow-2xl hover:shadow-[#d4af37]/30 transition-all"
          >
            Empezar ahora mismo
            <span>→</span>
          </a>
          <p className="text-xs text-white/40 mt-3">
            Sin tarjeta de crédito · Cancelas cuando quieras
          </p>
        </motion.div>
      </div>
    </section>
  );
}
