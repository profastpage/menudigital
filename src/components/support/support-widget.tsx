'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Mail, ExternalLink } from 'lucide-react';

/**
 * Widget flotante de soporte — visible en todas las rutas /dashboard/*.
 *
 * Botón circular en esquina inferior derecha que abre un popup con:
 * - WhatsApp
 * - Email
 * - Centro de ayuda
 *
 * Estilo: gold accent consistente con el branding.
 */
export function SupportWidget() {
  const [open, setOpen] = useState(false);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Cerrar soporte' : 'Abrir soporte'}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] shadow-lg shadow-[#d4af37]/40 flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Popup */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[320px] max-w-[calc(100vw-2.5rem)] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#d4af37]/20 to-transparent p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#d4af37]/30 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[#d4af37]" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">Soporte MenuPro</div>
                <div className="text-xs text-white/60">Lun-Vie 9am-7pm · Tiempo respuesta ~5 min</div>
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="p-3 space-y-2">
            <a
              href="https://wa.me/51987654321?text=Hola%20MenuPro,%20necesito%20ayuda%20con"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">WhatsApp</div>
                <div className="text-xs text-white/60">+51 987 654 321</div>
              </div>
              <ExternalLink className="w-3 h-3 text-white/40" />
            </a>

            <a
              href="mailto:soporte@menudigital.pro"
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              <div className="w-9 h-9 rounded-full bg-[#d4af37] flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-[#1a1a2e]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">Email</div>
                <div className="text-xs text-white/60 truncate">soporte@menudigital.pro</div>
              </div>
            </a>

            <a
              href="/dashboard/ayuda"
              className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition"
            >
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">Centro de ayuda</div>
                <div className="text-xs text-white/60">Preguntas frecuentes</div>
              </div>
            </a>
          </div>

          {/* Footer */}
          <div className="px-3 pb-3">
            <p className="text-[10px] text-white/40 text-center">
              ¿Emerencia fuera de horario? Email con prioridad: soporte@menudigital.pro
            </p>
          </div>
        </div>
      )}
    </>
  );
}
