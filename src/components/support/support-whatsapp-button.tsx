'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/support/whatsapp-icon';

/**
 * Botón flotante sticky de WhatsApp para soporte al cliente.
 *
 * 3 variantes:
 *  - variant="landing": siempre visible en la landing. Mensaje genérico de ventas.
 *    Sin verificación de plan (visitantes sin cuenta también lo ven).
 *  - variant="dashboard": visible solo en dashboard. Verifica plan del usuario.
 *    PREMIUM/FULL → abre WhatsApp directo con mensaje contextual según ruta.
 *    FREE/PRO → abre modal upsell "Upgrade a Premium para soporte WhatsApp".
 *  - variant="always-on": como landing pero con mensaje custom (para páginas legales, etc.)
 *
 * Posición: fixed bottom-6 right-6 z-40 (no choca con bottom-nav mobile).
 * NO se renderiza en rutas públicas de restaurante (/r/*, /qr/*, /mozo/*) para no
 * confundir a los clientes del restaurante (ellos no deben contactar a MenuPro).
 *
 * Horario: muestra "En línea" de 9am-9pm hora Lima, "Te respondemos mañana" fuera.
 */

export const SUPPORT_WHATSAPP_NUMBER = '51933667414'; // +51 933 667 414
export const SUPPORT_WHATSAPP_DISPLAY = '+51 933 667 414';

interface Props {
  variant: 'landing' | 'dashboard' | 'always-on';
  /** Plan del usuario (solo relevante para variant="dashboard") */
  planId?: 'free' | 'pro' | 'premium' | 'full';
  /** Email del usuario (para incluir en mensaje pre-rellenado) */
  userEmail?: string;
  /** Mensaje custom (solo para variant="always-on") */
  customMessage?: string;
  className?: string;
}

export function SupportWhatsAppButton({
  variant,
  planId = 'free',
  userEmail,
  customMessage,
  className = '',
}: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile para ajustar posición (no chocar con bottom-nav del dashboard)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // No renderizar en rutas públicas de restaurante
  if (typeof window !== 'undefined') {
    if (
      pathname?.startsWith('/r/') ||
      pathname?.startsWith('/qr/') ||
      pathname?.startsWith('/mozo/') ||
      pathname?.startsWith('/auth/')
    ) {
      return null;
    }
  }

  // Calcular horario en línea (9am-9pm hora Lima, America/Lima)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      // Obtener hora de Lima usando Intl.DateTimeFormat
      const limaTime = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Lima',
        hour: 'numeric',
        hour12: false,
      }).format(now);
      const hour = parseInt(limaTime, 10);
      setIsOnline(hour >= 9 && hour < 21);
    };
    check();
    const t = setInterval(check, 60000); // actualizar cada minuto
    return () => clearInterval(t);
  }, []);

  // Generar mensaje pre-rellenado según contexto
  const message = useMemo(() => {
    if (variant === 'always-on' && customMessage) return customMessage;

    if (variant === 'landing') {
      return 'Hola, vengo de la web de MenuPro. Quisiera información sobre planes y precios.';
    }

    // Dashboard: mensaje contextual según ruta
    const planName = planId.toUpperCase();
    const email = userEmail ? ` (cuenta: ${userEmail})` : '';

    if (pathname?.includes('/billing')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre facturación.`;
    }
    if (pathname?.includes('/mozos')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre mozos.`;
    }
    if (pathname?.includes('/mesas')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre mesas.`;
    }
    if (pathname?.includes('/inventario')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre inventario.`;
    }
    if (pathname?.includes('/comandas')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre comandas.`;
    }
    if (pathname?.includes('/cocina')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre cocina.`;
    }
    if (pathname?.includes('/reportes') || pathname?.includes('/analytics')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre reportes y analytics.`;
    }
    if (pathname?.includes('/domains')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre dominio propio.`;
    }
    if (pathname?.includes('/onboarding')) {
      return `Hola, soy cliente ${planName}${email}. Tengo una consulta sobre el onboarding.`;
    }
    // Default dashboard
    return `Hola, soy cliente ${planName}${email}. Necesito ayuda con MenuPro.`;
  }, [variant, customMessage, planId, userEmail, pathname]);

  // ¿Tiene acceso a WhatsApp directo? (solo PREMIUM/FULL en variant dashboard)
  const hasWhatsappAccess = variant === 'landing' || variant === 'always-on' || planId === 'premium' || planId === 'full';

  const handleClick = () => {
    if (variant === 'dashboard' && !hasWhatsappAccess) {
      // FREE/PRO → mostrar upsell
      setShowUpsell(true);
      return;
    }
    // Abrir WhatsApp con mensaje pre-rellenado
    const url = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Cerrar con Escape
  useEffect(() => {
    if (!open && !showUpsell) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setShowUpsell(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, showUpsell]);

  return (
    <>
      {/* ─── Botón flotante sticky ─── */}
      {/* En dashboard mobile: subimos el botón para que no choque con el bottom-nav (h-64px) */}
      <div
        className={`fixed right-4 sm:right-6 z-40 transition-all ${className}`}
        style={{
          bottom: isMobile
            ? 'calc(72px + env(safe-area-inset-bottom, 0px))'
            : '24px',
        }}
      >
        {/* Tooltip / Popup de info (se abre al hover en desktop, click en mobile) */}
        {open && (
          <div className="absolute bottom-full right-0 mb-3 w-[300px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-[#25D366] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                    <WhatsAppIcon className="w-6 h-6" fillColor="white" />
                  </div>
                  <div>
                    <div className="font-bold text-base">Soporte MenuPro</div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
                      {isOnline ? 'En línea ahora' : 'Fuera de horario'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="text-sm text-gray-700">
                {variant === 'landing' ? (
                  <p>¿Tienes preguntas sobre MenuPro? Escríbenos por WhatsApp y te respondemos en minutos.</p>
                ) : hasWhatsappAccess ? (
                  <p>Como cliente <span className="font-bold uppercase text-[#d4af37]">{planId}</span> tienes soporte WhatsApp prioritario.</p>
                ) : (
                  <p>Soporte WhatsApp disponible desde el plan <span className="font-bold text-[#d4af37]">Premium</span>.</p>
                )}
              </div>

              <div className="text-xs text-gray-500 flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <div>Lunes a Sábado: 9am - 9pm (hora Perú)</div>
                  <div className="mt-0.5">Tiempo respuesta: {isOnline ? '~5 min' : 'próximo día hábil'}</div>
                </div>
              </div>

              <button
                onClick={handleClick}
                className="w-full bg-[#25D366] hover:bg-[#1fae57] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition active:scale-[0.98] min-h-[44px]"
              >
                <WhatsAppIcon className="w-5 h-5" fillColor="white" />
                {hasWhatsappAccess ? 'Abrir WhatsApp' : 'Ver planes Premium'}
              </button>

              <a
                href="mailto:soporte@menudigital.pro"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-sm"
              >
                o envíanos un email
              </a>
            </div>
          </div>
        )}

        {/* Botón principal */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Contactar soporte por WhatsApp"
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1fae57] shadow-lg shadow-[#25D366]/40 flex items-center justify-center transition-all active:scale-95 group"
        >
          {/* Pulse animation ring (solo cuando hay mensaje nuevo / online) */}
          {isOnline && !open && (
            <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          )}
          {open ? (
            <X className="w-7 h-7 text-white relative z-10" />
          ) : (
            <WhatsAppIcon className="w-8 h-8 relative z-10" fillColor="white" />
          )}
          {/* Badge "online" */}
          {!open && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-300 border-2 border-white" />
          )}
        </button>
      </div>

      {/* ─── Modal Upsell (FREE/PRO en dashboard) ─── */}
      {showUpsell && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowUpsell(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-[#d4af37] to-[#f4d35e] p-6 text-[#0a0a14]">
              <button
                onClick={() => setShowUpsell(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold uppercase tracking-wide text-sm">Soporte WhatsApp Premium</span>
              </div>
              <h3 className="text-2xl font-extrabold leading-tight">
                Hazte Premium y obtén soporte WhatsApp directo
              </h3>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm">
                Como cliente <span className="font-bold uppercase">{planId}</span> tienes soporte por email y centro de ayuda.
                Upgrade a <span className="font-bold text-[#d4af37]">Premium</span> o <span className="font-bold text-[#d4af37]">Full</span> y desbloquea:
              </p>

              <div className="space-y-2.5">
                {[
                  'WhatsApp directo con respuesta en ~5 min',
                  'Horario extendido: Lun-Sáb 9am-9pm',
                  'Soporte prioritario sobre tickets de Free/Pro',
                  'Asistencia con configuración de menú, mozos y dominio',
                ].map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#25D366] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 text-center">
                💡 Mientras tanto, puedes escribirnos a <span className="font-semibold">soporte@menudigital.pro</span>
              </div>

              <Link
                href="/dashboard/billing"
                onClick={() => setShowUpsell(false)}
                className="block w-full text-center bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#0a0a14] font-extrabold py-3.5 rounded-xl hover:opacity-95 active:scale-[0.98] transition shadow-lg shadow-amber-500/30"
              >
                Ver planes y hacer upgrade
              </Link>
              <button
                onClick={() => setShowUpsell(false)}
                className="block w-full text-center text-gray-500 text-sm hover:text-gray-700 py-2"
              >
                Quizás más tarde
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
