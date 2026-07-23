'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    num: '01',
    title: 'Crea tu cuenta',
    desc: 'Regístrate gratis con email o Google. Sin tarjeta de crédito. En 30 segundos estás dentro.',
  },
  {
    num: '02',
    title: 'Diseña tu menú',
    desc: 'Agrega categorías, platos, precios e imágenes. Vista previa en vivo mientras editas.',
  },
  {
    num: '03',
    title: 'Publica y comparte',
    desc: 'Obtén tu URL única y código QR. Compártelo en redes, imprímelo en mesas, ponlo en tus flyers.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-28 border-t border-white/5">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-xs font-semibold text-[#d4af37] tracking-wider mb-4">
            SIMPLE Y RÁPIDO
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            En 3 pasos
          </h2>
          <p className="text-lg text-white/60">
            De cero a menú publicado en menos de 5 minutos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className="text-6xl font-bold bg-gradient-to-b from-[#d4af37]/40 to-transparent bg-clip-text text-transparent mb-4">
                {s.num}
              </div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-white/60 leading-relaxed">{s.desc}</p>
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#d4af37]/40 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
