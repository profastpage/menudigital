'use client';

import { motion } from 'framer-motion';
import {
  Smartphone,
  ShoppingCart,
  QrCode,
  Image as ImageIcon,
  Zap,
  Shield,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Smartphone,
    title: 'Editor visual',
    desc: 'Diseña tu carta en vivo con vista previa instantánea. Sin código, sin complicaciones.',
  },
  {
    icon: ShoppingCart,
    title: 'Carrito con WhatsApp',
    desc: 'Tus clientes arman su pedido y lo envían directo a tu WhatsApp. Cero comisiones por venta.',
  },
  {
    icon: QrCode,
    title: 'Código QR para mesas',
    desc: 'Descarga QR en alta resolución, imprímelo y ponlo en cada mesa de tu restaurante.',
  },
  {
    icon: ImageIcon,
    title: 'Imágenes ilimitadas',
    desc: 'Sube fotos profesionales de tus platos. Drag & drop, optimización automática.',
  },
  {
    icon: Zap,
    title: 'Ultra rápido',
    desc: 'Carga en menos de 1 segundo. Optimizado para conexiones móviles lentas.',
  },
  {
    icon: Shield,
    title: 'Sin comisiones',
    desc: 'Pagas solo la suscripción mensual. MenuPro no toca tus ventas. Nunca.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-block px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37] tracking-wider mb-4">
              TODO LO QUE NECESITAS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Diseñado para
              <span className="bg-gradient-to-r from-[#d4af37] to-[#f4d35e] bg-clip-text text-transparent">
                {' '}restaurantes reales
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Desde el ceviche hasta la anticuchería. MenuPro funciona en cualquier
              tipo de restaurante, pollería, sanguchería o cafetería.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-[#d4af37]/40 transition-all hover:-translate-y-1"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/20 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-[#d4af37]" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
