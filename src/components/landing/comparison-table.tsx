"use client";

import { motion } from "framer-motion";
import { Check, Minus, Infinity as InfinityIcon } from "lucide-react";
import { LIMIT_COMPARISON, PLANS } from "@/lib/plans";

const PLAN_IDS: Array<"free" | "pro" | "premium" | "full"> = ["free", "pro", "premium", "full"];

export function ComparisonTable() {
  return (
    <section id="comparativa" className="py-20 md:py-28 border-t border-white/5 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#9d4edd]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#9d4edd]/10 border border-[#9d4edd]/30 text-xs font-semibold text-[#9d4edd] tracking-wider mb-4">
              COMPARATIVA DETALLADA
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Compara
              <span className="bg-gradient-to-r from-[#9d4edd] to-[#d4af37] bg-clip-text text-transparent">
                {" "}cada límite
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Mira exactamente qué obtienes en cada plan. El upgrade a Premium (S/ 99) vale la pena
              desde el primer día si tienes mesas, mozos o quieres white label.
            </p>
          </motion.div>
        </div>

        {/* Tabla comparativa */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden"
        >
          {/* Header row */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] bg-white/[0.03] border-b border-white/10">
            <div className="p-4 md:p-5">
              <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Característica</div>
            </div>
            {PLAN_IDS.map((id) => {
              const plan = PLANS[id];
              return (
                <div
                  key={id}
                  className={`p-4 md:p-5 text-center border-l border-white/5 ${
                    plan.highlight ? "bg-[#d4af37]/5" : ""
                  }`}
                  style={
                    id === "premium" || id === "full"
                      ? { background: `${plan.color}10` }
                      : undefined
                  }
                >
                  <div
                    className="text-base md:text-lg font-bold"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {plan.priceMonthly === 0 ? "Gratis" : `S/ ${plan.priceMonthly}/mes`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body rows */}
          <div className="divide-y divide-white/5">
            {LIMIT_COMPARISON.map((row, idx) => (
              <motion.div
                key={row.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.5) }}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] hover:bg-white/[0.02] transition-colors group"
              >
                <div className="p-4 md:p-5 flex items-center gap-2.5">
                  <span className="text-lg">{row.icon}</span>
                  <span className="text-sm md:text-base text-white/85 font-medium">{row.label}</span>
                </div>
                {row.values.map((value, i) => {
                  const planId = PLAN_IDS[i];
                  const plan = PLANS[planId];
                  const isCheck = value === "✓";
                  const isDash = value === "—";
                  const isInfinite = value === "∞";
                  const isHighlight = plan.highlight;
                  return (
                    <div
                      key={i}
                      className={`p-4 md:p-5 text-center border-l border-white/5 flex items-center justify-center ${
                        isHighlight ? "bg-[#d4af37]/[0.03]" : ""
                      }`}
                      style={
                        planId === "premium" || planId === "full"
                          ? { background: `${plan.color}[0.03]` }
                          : undefined
                      }
                    >
                      {isCheck ? (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: `${plan.color}25` }}
                        >
                          <Check className="w-3.5 h-3.5" style={{ color: plan.color }} />
                        </div>
                      ) : isDash ? (
                        <Minus className="w-4 h-4 text-white/20" />
                      ) : isInfinite ? (
                        <InfinityIcon className="w-5 h-5" style={{ color: plan.color }} />
                      ) : (
                        <span
                          className="text-sm md:text-base font-bold"
                          style={{ color: plan.color }}
                        >
                          {value}
                        </span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>

          {/* CTA row */}
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] border-t border-white/10 bg-white/[0.02]">
            <div className="p-4 md:p-5" />
            {PLAN_IDS.map((id) => {
              const plan = PLANS[id];
              const href =
                id === "free" ? "/register" : `/register?plan=${id}`;
              return (
                <div
                  key={id}
                  className={`p-4 md:p-5 border-l border-white/5 flex justify-center`}
                >
                  <a
                    href={href}
                    className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      plan.highlight
                        ? "bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:shadow-lg hover:shadow-[#d4af37]/30"
                        : "border border-white/15 text-white hover:bg-white/10"
                    }`}
                    style={
                      id === "premium" || id === "full"
                        ? {
                            background: `linear-gradient(to right, ${plan.color}, ${plan.color}cc)`,
                            color: "#0a0a14",
                          }
                        : undefined
                    }
                  >
                    Elegir {plan.name}
                  </a>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Nota debajo */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs text-white/40 mt-6 max-w-3xl mx-auto"
        >
          💡 <strong className="text-white/60">Tip:</strong> Si tu restaurante tiene más de 3 cartas (desayuno/almuerzo/cena/bebidas)
          o más de 3 fotos por plato, el plan <span className="text-[#9d4edd] font-semibold">Premium</span> te conviene.
          Si tienes 2+ sucursales o necesitas voucher printing POS, ve por <span className="text-[#e63946] font-semibold">Full</span>.
        </motion.p>
      </div>
    </section>
  );
}
