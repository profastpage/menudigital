'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, ExternalLink, HelpCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/support/whatsapp-icon';

/**
 * Widget de soporte — INLINE (no floating).
 *
 * Dos modos:
 *  - variant="icon": botón cuadrado h-11 w-11 (mismo tamaño que InstallAppButton y Logout en el header móvil)
 *  - variant="sidebar": botón full-width para el sidebar desktop
 *
 * El popup se despliega debajo (mobile header) o a la izquierda (sidebar) y se cierra al hacer click fuera o Escape.
 */
interface Props {
  variant?: 'icon' | 'sidebar';
  className?: string;
}

export function SupportWidget({ variant = 'icon', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Pequeño delay para que el click que abre no lo cierre de inmediato
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [open]);

  if (variant === 'sidebar') {
    return (
      <div ref={wrapRef} className={`relative ${className}`}>
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Abrir soporte"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="flex-1 text-left">Soporte</span>
        </button>
        {open && (
          <div className="absolute bottom-full left-0 right-0 mb-2 w-72 max-w-[calc(100vw-2rem)] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <SupportContent onClose={() => setOpen(false)} />
          </div>
        )}
      </div>
    );
  }

  // Icon variant (mobile header) — mismo tamaño que los demás botones (h-11 w-11)
  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Cerrar soporte' : 'Abrir soporte'}
        className="w-11 h-11 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition text-white/60 hover:text-white"
      >
        {open ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <SupportContent onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

function SupportContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#25D366]/20 to-transparent p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#25D366]/30 flex items-center justify-center flex-shrink-0">
            <WhatsAppIcon className="w-5 h-5" fillColor="#25D366" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-white text-sm">Soporte MenuPro</div>
            <div className="text-xs text-white/60">Lun-Vie 9am-7pm · Tiempo respuesta ~5 min</div>
          </div>
        </div>
      </div>

      {/* Opciones */}
      <div className="p-3 space-y-2">
        <a
          href="https://wa.me/51933667414?text=Hola%20MenuPro,%20necesito%20ayuda%20con"
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 transition min-h-[44px]"
        >
          <div className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <WhatsAppIcon className="w-5 h-5" fillColor="white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-sm">WhatsApp</div>
            <div className="text-xs text-white/60">+51 933 667 414</div>
          </div>
          <ExternalLink className="w-3 h-3 text-white/40 flex-shrink-0" />
        </a>

        <a
          href="mailto:soporte@menudigital.pro"
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition min-h-[44px]"
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
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition min-h-[44px]"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-4 h-4 text-white/80" />
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
          ¿Emergencia fuera de horario? Email con prioridad: soporte@menudigital.pro
        </p>
      </div>
    </>
  );
}
