'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Mail,
  Search,
  ChevronDown,
  Video,
  BookOpen,
  ShoppingCart,
  CreditCard,
  Users,
  Image as ImageIcon,
  QrCode,
  HelpCircle,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/support/whatsapp-icon';

interface FaqItem {
  q: string;
  a: string;
}

interface FaqCategory {
  title: string;
  icon: typeof HelpCircle;
  items: FaqItem[];
}

const FAQ: FaqCategory[] = [
  {
    title: 'Empezando',
    icon: BookOpen,
    items: [
      {
        q: '¿Cómo creo mi primer menú?',
        a: 'Ve a la sección "Crear menú" del dashboard. Si acabas de registrarte, el asistente de configuración inicial te guiará automáticamente. Necesitarás: nombre del negocio, WhatsApp de contacto y nombre del menú. Puedes agregar platos inmediatamente después.',
      },
      {
        q: '¿Cómo escanea mi cliente la carta?',
        a: 'Genera el código QR desde "Compartir" en el editor del menú. Imprímelo (tamaño recomendado: 8x8 cm) y ponlo en cada mesa. El cliente escanea con la cámara del celular y ve la carta al instante, sin instalar nada.',
      },
      {
        q: '¿Puedo tener más de un menú?',
        a: 'Sí. El plan Free permite 1 menú. Pro permite hasta 5. FULL permite menús ilimitados. Cada menú tiene su propio QR y URL personalizada.',
      },
      {
        q: '¿Cómo personalizo los colores y la fuente?',
        a: 'En el editor del menú, pestaña "Diseño". Puedes elegir entre tema claro u oscuro, color principal, fuente tipográfica, tamaño de imágenes y estilo de tarjetas. Los cambios se ven en tiempo real.',
      },
    ],
  },
  {
    title: 'Pagos y Planes',
    icon: CreditCard,
    items: [
      {
        q: '¿Cómo cambio de plan?',
        a: 'Ve a "Facturación" en el dashboard. Selecciona el plan Pro o FULL y serás redirigido a MercadoPago para completar el pago. La activación es inmediata tras el pago.',
      },
      {
        q: '¿Puedo cancelar cuando quiera?',
        a: 'Sí, sin penalidad. Cancela desde "Facturación → Cancelar suscripción". Tu cuenta vuelve al plan Free al final del ciclo de pago. Tus menús y datos se conservan.',
      },
      {
        q: '¿Cómo funciona la garantía de 7 días?',
        a: 'Si en los primeros 7 días tras tu primer pago no estás satisfecho, escríbenos a reembolsos@menudigital.pro y te devolvemos el 100% del monto. Sin preguntas.',
      },
      {
        q: '¿Pagan mis clientes por hacer pedidos?',
        a: 'No. MenuPro no cobra comisión por pedido. Tus clientes pagan directamente a tu negocio por WhatsApp o en efectivo al mozo.',
      },
    ],
  },
  {
    title: 'Mozos y Comandas',
    icon: Users,
    items: [
      {
        q: '¿Cómo registro a mis mozos?',
        a: 'Ve a "Mozos" en el dashboard. Crea cada mozo con su nombre, DNI y un PIN de 4 dígitos. El sistema genera automáticamente un código QR privado para cada uno. El mozo entra a su panel escaneando su QR.',
      },
      {
        q: '¿Cómo funcionan las mesas?',
        a: 'Ve a "Mesas" en el dashboard. Crea las mesas con su número y capacidad. Asocia cada mesa a una sucursal. El estado (libre, ocupada, reservada) se actualiza automáticamente según las comandas activas.',
      },
      {
        q: '¿Qué hace el panel de cocina?',
        a: 'Muestra en tiempo real las comandas enviadas a cocina, ordenadas por hora de llegada. Cuando un plato está listo, marca "Listo" y el mozo recibe una notificación en su celular.',
      },
      {
        q: '¿Puedo tener varias sucursales?',
        a: 'Sí, en plan FULL. Cada sucursal tiene sus propias mesas, mozos e inventario. Las comandas se separan por sucursal para evitar confusión.',
      },
    ],
  },
  {
    title: 'Imágenes y Fotos',
    icon: ImageIcon,
    items: [
      {
        q: '¿Qué tamaño deben tener las fotos?',
        a: 'Recomendado: 1200x800 px o cuadradas 800x800 px. Formato JPG o PNG. El sistema optimiza automáticamente a WebP para carga rápida. Máximo 5MB por imagen.',
      },
      {
        q: '¿Cómo funciona "Quitar fondo"?',
        a: 'Botón disponible en el editor de platos (plan Pro+). Sube una foto, pulsa "Quitar fondo" y la IA recorta automáticamente el plato, lo centra y lo guarda con fondo transparente. Tienes 30 usos mensuales en Pro, ilimitados en FULL.',
      },
      {
        q: '¿Puedo tener varias fotos por plato?',
        a: 'Sí, hasta 5 fotos por plato en plan Pro, ilimitadas en FULL. La primera foto es la principal (se muestra en la lista). Las demás aparecen en el lightbox al hacer clic.',
      },
    ],
  },
  {
    title: 'Códigos QR',
    icon: QrCode,
    items: [
      {
        q: '¿Cómo imprimo mis QR?',
        a: 'Ve a "Compartir" en el editor del menú. Descarga el PNG en alta resolución (1024x1024 px). Imprímelo en tamaño mínimo 8x8 cm. Para mejor durabilidad, recomendamos plastificar o imprimir en material resistente.',
      },
      {
        q: '¿Qué pasa si cambio el slug de mi menú?',
        a: 'El QR anterior dejará de funcionar. Recomendamos elegir un slug definitivo desde el principio. Si necesitas cambiarlo, deberás reimprimir los QR.',
      },
      {
        q: '¿Puedo tener dominio propio (mi-web.com)?',
        a: 'Sí, en plan FULL. Ve a "Dominios" en el dashboard. Apunta tu dominio con un registro CNAME a Vercel y verifica. La carta se servirá desde tu dominio.',
      },
    ],
  },
];

export function AyudaClient() {
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = FAQ.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Centro de Ayuda</h1>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto">
            Encuentra respuestas rápidas a las preguntas más comunes. Si no encuentras
            lo que buscas, contáctanos por WhatsApp o email.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Busca tu pregunta..."
            className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#d4af37] transition"
          />
        </div>

        {/* Quick contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <a
            href="https://wa.me/51933667414?text=Hola%20MenuPro,%20necesito%20ayuda%20con"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-4 p-5 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/5 border border-[#25D366]/30 rounded-xl hover:bg-[#25D366]/10 transition group"
          >
            <div className="w-12 h-12 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
              <WhatsAppIcon className="w-7 h-7" fillColor="#25D366" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white">WhatsApp</div>
              <div className="text-xs text-white/60">Respuesta en minutos (Lun-Vie 9am-7pm)</div>
            </div>
          </a>

          <a
            href="mailto:soporte@menudigital.pro"
            className="flex items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition group"
          >
            <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white">Email</div>
              <div className="text-xs text-white/60 truncate">soporte@menudigital.pro</div>
            </div>
          </a>
        </div>

        {/* FAQ by category */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 mb-4">
              No encontramos resultados para “{search}”.
            </p>
            <a
              href="https://wa.me/51933667414"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] text-white font-semibold rounded-lg hover:opacity-90 transition"
            >
              <WhatsAppIcon className="w-5 h-5" fillColor="white" />
              Preguntar por WhatsApp
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.title}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#d4af37]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#d4af37]" />
                    </div>
                    <h2 className="text-xl font-bold">{cat.title}</h2>
                  </div>
                  <div className="space-y-2">
                    {cat.items.map((item, idx) => {
                      const id = `${cat.title}-${idx}`;
                      const isOpen = openId === id;
                      return (
                        <div
                          key={id}
                          className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
                        >
                          <button
                            onClick={() => setOpenId(isOpen ? null : id)}
                            className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition"
                          >
                            <span className="font-medium text-white/90">{item.q}</span>
                            <ChevronDown
                              className={`w-5 h-5 text-white/40 flex-shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-0 text-sm text-white/70 leading-relaxed">
                              {item.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Video tutorials */}
        <div className="mt-12 p-6 bg-gradient-to-br from-[#d4af37]/10 to-[#f4d35e]/5 border border-[#d4af37]/20 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#d4af37]/20 flex items-center justify-center flex-shrink-0">
              <Video className="w-6 h-6 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">¿Prefieres aprender en video?</h3>
              <p className="text-sm text-white/60 mb-3">
                Tenemos una serie de tutoriales de 2-3 minutos cada uno para que aprendas
                a sacarle el máximo a MenuPro.
              </p>
              <a
                href="https://www.youtube.com/@menupro"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#d4af37] text-[#1a1a2e] font-semibold rounded-lg text-sm hover:opacity-90 transition"
              >
                <Video className="w-4 h-4" />
                Ver tutoriales en YouTube
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-white/40 space-y-2">
          <p>
            ¿No encontraste tu respuesta?{' '}
            <Link href="/legal/terminos" className="text-[#d4af37] hover:underline">
              Términos
            </Link>{' '}
            ·{' '}
            <Link href="/legal/privacidad" className="text-[#d4af37] hover:underline">
              Privacidad
            </Link>{' '}
            ·{' '}
            <Link href="/legal/reembolsos" className="text-[#d4af37] hover:underline">
              Reembolsos
            </Link>
          </p>
          <p>© {new Date().getFullYear()} MenuPro · Hecho con ♥ en Perú</p>
        </div>
      </div>
    </div>
  );
}
