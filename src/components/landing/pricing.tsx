'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Utensils, Building2 } from 'lucide-react';

const PLANS_LANDING = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    description: 'Para empezar y validar tu idea',
    color: '#6b7280',
    features: [
      '1 menú digital',
      'Hasta 10 platos',
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
    color: '#d4af37',
    features: [
      'Menús y platos ilimitados',
      'Imágenes ilimitadas + WebP',
      '30 créditos "Quitar fondo" IA',
      'QR profesional HD + dinámico',
      'Analytics de visitas',
      'Menú multi-idioma (ES/EN)',
      'Tema PedidosYa/Rappi',
      '100% white-label (sin marca)',
      'Soporte prioritario WhatsApp',
    ],
    cta: 'Empezar Pro',
    href: '/register',
    highlight: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    priceMonthly: 99,
    description: 'Logística interna completa',
    color: '#9d4edd',
    features: [
      'Todo lo del plan Pro',
      '100 créditos "Quitar fondo"',
      '🍽️ Gestión de mesas (hasta 50)',
      '👨‍🍳 Gestión de mozos (hasta 20)',
      '📋 Comandas: mesa → cocina → entrega',
      '🔥 Cocina Display en tiempo real',
      '📦 Inventario de insumos con recetas',
      '🚨 Alertas de stock bajo',
      '⚡ Auto-descuento de stock al facturar',
    ],
    cta: 'Empezar Premium',
    href: '/register?plan=premium',
    highlight: false,
  },
  {
    id: 'full',
    name: 'Full',
    priceMonthly: 199,
    description: 'Multi-sucursal + voucher printing',
    color: '#e63946',
    features: [
      'Todo lo del plan Premium',
      '✨ Quitar fondo ilimitado',
      '🏬 Multi-sucursal ilimitada',
      '🖨️ Voucher printing 1-click (POS/A4/A5)',
      '📈 Reportes avanzados',
      '🔄 Transferencia de stock',
      '🔗 Integraciones API',
      '👑 Onboarding personalizado',
      '24/7 soporte prioritario',
    ],
    cta: 'Empezar Full',
    href: '/register?plan=full',
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37] tracking-wider mb-4">
            PRECIOS TRANSPARENTES
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Planes simples, sin comisiones
          </h2>
          <p className="text-lg text-white/60">
            Sin contratos. Cancelas cuando quieras. Pagos en Soles vía MercadoPago.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS_LANDING.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-3xl p-6 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-[#d4af37]/10 to-[#15152a] border border-[#d4af37]/40'
                  : 'bg-white/[0.03] border border-white/10'
              }`}
              style={plan.id === 'premium' || plan.id === 'full' ? {
                background: `linear-gradient(to bottom, ${plan.color}10, #15152a)`,
                borderColor: `${plan.color}40`,
              } : undefined}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-[#d4af37] text-[#1a1a2e] text-xs font-bold">
                  POPULAR
                </div>
              )}
              {(plan.id === 'premium' || plan.id === 'full') && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-xs font-bold"
                  style={{ background: plan.color, color: '#0a0a14' }}
                >
                  {plan.id === 'premium' ? 'PREMIUM' : 'FULL'}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                {plan.id === 'full' && <Crown className="w-5 h-5" style={{ color: plan.color }} />}
                {plan.id === 'premium' && <Sparkles className="w-5 h-5" style={{ color: plan.color }} />}
                <h3 className="text-2xl font-bold" style={{ color: plan.color }}>
                  {plan.name}
                </h3>
              </div>
              <p className="text-sm text-white/60 mb-6 min-h-[3em]">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">S/ {plan.priceMonthly}</span>
                <span className="text-white/50">/mes</span>
                {plan.priceMonthly > 0 && (
                  <div className="text-xs text-white/40 mt-1">≈ ${Math.round(plan.priceMonthly / 3.9)} USD</div>
                )}
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: plan.color }}
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
                    : plan.id === 'free'
                    ? 'bg-white/5 border border-white/15 text-white hover:bg-white/10'
                    : 'bg-gradient-to-r text-[#0a0a14] hover:opacity-90'
                }`}
                style={plan.id === 'premium' || plan.id === 'full' ? {
                  background: `linear-gradient(to right, ${plan.color}, ${plan.color}cc)`,
                } : undefined}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Highlight Premium y Full */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 bg-[#9d4edd]/5 border border-[#9d4edd]/30 flex items-start gap-4">
            <Utensils className="w-8 h-8 text-[#9d4edd] flex-shrink-0 mt-1" />
            <div>
              <div className="font-semibold text-[#9d4edd] mb-1">¿Tienes mesas y mozos?</div>
              <div className="text-sm text-white/70">
                El plan <strong>Premium (S/ 99/mes)</strong> incluye toda la logística interna: comandas que van del mozo a la cocina, inventario de insumos con recetas automáticas, y cocina display en tiempo real.
              </div>
            </div>
          </div>
          <div className="rounded-2xl p-5 bg-[#e63946]/5 border border-[#e63946]/30 flex items-start gap-4">
            <Building2 className="w-8 h-8 text-[#e63946] flex-shrink-0 mt-1" />
            <div>
              <div className="font-semibold text-[#e63946] mb-1">¿Tienes varias sucursales?</div>
              <div className="text-sm text-white/70">
                El plan <strong>Full (S/ 199/mes)</strong> desbloquea multi-sucursal, voucher printing 1-click para POS, transferencias de stock entre locales, y reportes consolidados.
              </div>
            </div>
          </div>
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
