'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, WifiOff, Zap, Check } from 'lucide-react';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import { InstallInstructionsModal } from './install-instructions-modal';
import { type PlanId, isPlanAtLeast } from '@/lib/plans';

interface Props {
  /** Plan del dueño del restaurante — define qué features offline tiene el mozo */
  planId?: PlanId;
  /** Nombre del mozo para personalizar el copy */
  waiterName?: string;
  /** Variante: 'mozo' para el panel del mozo, 'dashboard' para dueño */
  variant?: 'mozo' | 'dashboard';
}

// Clave localStorage independiente de la del hook — controla si el banner (no el botón) fue cerrado
const BANNER_DISMISS_KEY = 'menupro_install_banner_dismissed_at';
const BANNER_DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 3; // 3 días

/**
 * Banner prominent que invita al usuario a instalar la PWA.
 *
 * Comportamiento:
 * - Se muestra solo si la app NO está instalada (state !== "installed")
 * - Si el usuario lo cierra, no vuelve a aparecer por 3 días (salvo que se desinstale)
 * - Si la app se instala desde el banner, desaparece inmediatamente
 * - Si la app se desinstala después, el banner vuelve a aparecer (display-mode: standalone deja de cumplirse)
 *
 * Variante "mozo": banner púrpura-dorado, copy enfocado en tomar comandas offline
 * Variante "dashboard": banner naranja, copy enfocado en acceso rápido al panel
 */
export function MozoInstallBanner({ planId, waiterName, variant = 'mozo' }: Props) {
  const { platform, canInstall, needsManualInstructions, state, promptInstall, dismiss } = usePwaInstall();
  const [modalOpen, setModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // Cargar estado de dismiss del banner desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < BANNER_DISMISS_DURATION_MS) {
      setBannerDismissed(true);
    }
  }, []);

  // Si la app se instala, ocultar banner inmediatamente
  useEffect(() => {
    if (state === 'installed') {
      setBannerDismissed(true);
    }
  }, [state]);

  // Reset banner si la app se desinstala (state deja de ser "installed")
  useEffect(() => {
    if (state !== 'installed' && state !== 'dismissed') {
      // Verificar si el dismiss del banner ya expiró
      const dismissedAt = localStorage.getItem(BANNER_DISMISS_KEY);
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > BANNER_DISMISS_DURATION_MS) {
        setBannerDismissed(false);
      }
    }
  }, [state]);

  // No mostrar nada si:
  // - Ya está instalada
  // - Estado no disponible (unsupported en no-iOS)
  // - El banner fue cerrado por el usuario recientemente
  // - Just installed (mostrar confirmación abajo)
  if (state === 'installed') {
    if (justInstalled) {
      return (
        <div className={`mx-3 my-2 rounded-xl border p-3 flex items-center gap-2 ${
          variant === 'mozo'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">¡App instalada! Ábrela desde tu pantalla de inicio.</span>
        </div>
      );
    }
    return null;
  }

  if (state === 'unsupported' && platform !== 'ios') return null;
  if (bannerDismissed) return null;

  const handleInstall = async () => {
    if (needsManualInstructions) {
      setModalOpen(true);
      return;
    }
    if (canInstall) {
      const result = await promptInstall();
      if (result === 'manual') {
        setModalOpen(true);
      } else if (result === 'accepted') {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 5000);
      }
      return;
    }
    // iOS sin beforeinstallprompt
    if (platform === 'ios') {
      setModalOpen(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISS_KEY, Date.now().toString());
    setBannerDismissed(true);
    dismiss(); // también marcar en el hook
  };

  // Features según plan
  const hasOffline = planId ? isPlanAtLeast(planId, 'premium') : false;
  const hasBackgroundSync = planId ? isPlanAtLeast(planId, 'full') : false;

  const copy = variant === 'mozo'
    ? {
        title: waiterName ? `${waiterName}, instala tu panel` : 'Instala tu panel de mozo',
        subtitle: hasBackgroundSync
          ? 'Comandas offline con sync automático — sin perder pedidos por mala señal'
          : hasOffline
          ? 'Toma comandas sin internet y se sincronizan al volver la conexión'
          : 'Acceso rápido desde tu pantalla de inicio — no vuelvas a escribir el enlace',
        cta: 'Instalar app',
        gradient: 'from-[#9d4edd] to-[#d4af37]',
      }
    : {
        title: 'Instala MenuPro en tu dispositivo',
        subtitle: 'Acceso rápido desde tu pantalla de inicio · carga instantánea',
        cta: 'Instalar app',
        gradient: 'from-[#ff6b35] to-[#e63946]',
      };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-3 my-2"
        >
          <div className={`rounded-xl border border-white/15 bg-gradient-to-br ${copy.gradient} p-[1px]`}>
            <div className="rounded-[11px] bg-[#0a0a14]/90 backdrop-blur p-3">
              <div className="flex items-start gap-3">
                {/* Icono */}
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${copy.gradient} flex items-center justify-center flex-shrink-0`}>
                  <Smartphone className="w-5 h-5 text-white" />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white">{copy.title}</div>
                  <div className="text-[11px] text-white/60 mt-0.5 leading-snug">
                    {copy.subtitle}
                  </div>

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {hasOffline && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-semibold">
                        <WifiOff className="w-2.5 h-2.5" />
                        Offline
                      </span>
                    )}
                    {hasBackgroundSync && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-semibold">
                        <Zap className="w-2.5 h-2.5" />
                        Auto-sync
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/5 text-white/60 text-[9px] font-semibold">
                      Gratis
                    </span>
                  </div>
                </div>

                {/* Cerrar */}
                <button
                  onClick={handleDismiss}
                  className="text-white/40 hover:text-white p-1 -m-1 flex-shrink-0"
                  aria-label="Cerrar banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleInstall}
                className={`mt-2.5 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r ${copy.gradient} text-white font-semibold text-sm hover:opacity-90 transition shadow-lg`}
              >
                <Smartphone className="w-4 h-4" />
                {copy.cta}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <InstallInstructionsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        platform={platform}
        variant={variant}
        onInstallNative={
          canInstall && !needsManualInstructions
            ? async () => {
                const r = await promptInstall();
                if (r === 'accepted') {
                  setModalOpen(false);
                  setJustInstalled(true);
                  setTimeout(() => setJustInstalled(false), 5000);
                } else if (r === 'dismissed') {
                  setModalOpen(false);
                }
              }
            : undefined
        }
      />
    </>
  );
}
