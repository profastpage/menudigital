'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    description: 'Para empezar y validar',
    features: [
      '1 menú digital',
      'Hasta 15 platos',
      'Hasta 5 imágenes',
      'Carrito con WhatsApp',
      'URL pública /r/tu-restaurante',
      'Vista previa en vivo',
      'Marca "Creado con MenuPro"',
    ],
    cta: 'Empezar gratis',
    href: '/register',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 35,
    description: 'Para restaurantes en serio',
    features: [
      'Menús ilimitados',
      'Platos ilimitados',
      'Hasta 30 imágenes',
      'Carrito con WhatsApp',
      'URL pública personalizada',
      'Vista previa en vivo',
      'Sin marca MenuPro',
      'Código QR descargable',
      'Analytics de visitas',
      'Soporte prioritario',
    ],
    cta: 'Empezar Pro',
    href: '/register',
    highlight: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37] tracking-wider mb-4">
            PRECIOS TRANSPARENTES
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Planes simples
          </h2>
          <p className="text-lg text-white/60">
            Sin comisiones por venta. Sin contratos. Cancelas cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-[#d4af37]/10 to-[#15152a] border border-[#d4af37]/40'
                  : 'bg-white/[0.03] border border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-[#d4af37] text-[#1a1a2e] text-xs font-bold">
                  RECOMENDADO
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                {plan.highlight && <Crown className="w-5 h-5 text-[#d4af37]" />}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
              </div>
              <p className="text-sm text-white/60 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-bold">S/ {plan.priceMonthly}</span>
                <span className="text-white/50">/mes</span>
                {plan.priceMonthly > 0 && (
                  <div className="text-xs text-white/40 mt-1">≈ ${Math.round(plan.priceMonthly / 3.9)} USD</div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.highlight ? 'text-[#d4af37]' : 'text-white/40'
                      }`}
                    />
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block text-center py-3.5 rounded-xl font-semibold transition ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90'
                    : 'bg-white/5 border border-white/15 text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-white/50 mt-8">
          ¿Necesitas algo más grande?{' '}
          <a href="mailto:hola@menupro.app" className="text-[#d4af37] hover:underline">
            Contáctanos
          </a>
        </p>
      </div>
    </section>
  );
}
