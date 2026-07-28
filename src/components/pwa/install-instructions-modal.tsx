"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, Monitor, Smartphone, Download, Check, Apple, Loader2, RefreshCw } from "lucide-react";
import type { Platform } from "@/hooks/use-pwa-install";

interface Props {
  open: boolean;
  onClose: () => void;
  platform: Platform;
  onInstallNative?: () => Promise<"accepted" | "dismissed" | "manual" | "failed" | "no-event"> | undefined;
  variant?: "dashboard" | "mozo" | "landing";
  /** Si true, omitir la sección "Instalar automáticamente" y mostrar solo pasos manuales (iOS o fallback cuando no hay evento) */
  manualOnly?: boolean;
}

export function InstallInstructionsModal({ open, onClose, platform, onInstallNative, variant = "dashboard", manualOnly: manualOnlyProp }: Props) {
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<"accepted" | "dismissed" | "failed" | "no-event" | "manual" | null>(null);

  // En iOS nunca hay evento nativo → siempre manualOnly
  // Si onInstallNative no se pasa → también manualOnly
  const manualOnly = manualOnlyProp || platform === "ios" || !onInstallNative;

  // Resetear cuando se cierra/abre
  const handleClose = () => {
    setInstallResult(null);
    setInstalling(false);
    onClose();
  };

  const handleInstallNative = async () => {
    if (!onInstallNative) return;
    setInstalling(true);
    const r = (await onInstallNative()) as "accepted" | "dismissed" | "failed" | "no-event" | "manual" | undefined;
    setInstalling(false);
    setInstallResult(r ?? "failed");
    // Si fue aceptado, cerrar el modal (la UI principal mostrará "App instalada")
    if (r === "accepted") {
      setTimeout(() => handleClose(), 600);
    }
  };

  const titleColor =
    variant === "mozo"
      ? "from-[#9d4edd] to-[#d4af37]"
      : variant === "landing"
      ? "from-[#d4af37] to-[#f4d35e]"
      : "from-[#ff6b35] to-[#e63946]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a14] border border-white/10 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${titleColor} flex items-center justify-center text-xl font-bold text-[#0a0a14] flex-shrink-0`}>
                  {variant === "mozo" ? "👨‍🍳" : "M"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-white truncate">
                    Instalar MenuPro{variant === "mozo" ? " · Panel del mozo" : ""}
                  </h3>
                  <p className="text-xs text-white/50">
                    {platform === "ios" && "iPhone / iPad"}
                    {platform === "android" && "Android"}
                    {platform === "desktop" && "Escritorio"}
                    {platform === "other" && "Tu dispositivo"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white flex-shrink-0"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ========================================
                Sección "Instalar automáticamente"
                SOLO en Android/desktop con evento disponible
                ======================================== */}
            {!manualOnly && (
              <div className="mb-5">
                {/* Resultado de la instalación */}
                {installResult === "accepted" ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                    <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-emerald-100">
                      ¡App instalada! Búscala en tu pantalla de inicio.
                    </p>
                  </div>
                ) : installResult === "dismissed" ? (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-sm text-amber-100 mb-2">
                      Cancelaste la instalación. Puedes intentarlo de nuevo cuando quieras.
                    </p>
                    <button
                      onClick={handleInstallNative}
                      disabled={installing}
                      className={`mt-1 w-full py-3 rounded-xl bg-gradient-to-r ${titleColor} text-[#0a0a14] font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2`}
                    >
                      {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      {installing ? "Abriendo diálogo..." : "Intentar de nuevo"}
                    </button>
                  </div>
                ) : installResult === "no-event" ? (
                  // El navegador no disparó beforeinstallprompt — mostrar instrucciones manuales
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-sm text-amber-100 mb-1 font-semibold">
                      Tu navegador no mostró el diálogo automático.
                    </p>
                    <p className="text-xs text-amber-100/70 mb-3">
                      Esto pasa a veces (Chrome decide no mostrarlo si acabas de llegar). Sigue los pasos manuales abajo — funciona igual.
                    </p>
                  </div>
                ) : installResult === "failed" ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-sm text-red-100 mb-2">
                      Hubo un error al abrir el diálogo. Intenta los pasos manuales abajo.
                    </p>
                  </div>
                ) : (
                  // Estado inicial: botón grande "Instalar automáticamente"
                  <>
                    {platform === "android" && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 mb-3">
                        <Smartphone className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-100/90 leading-relaxed">
                          Tu navegador soporta instalación directa. Toca el botón y aparecerá el diálogo de Chrome.
                        </p>
                      </div>
                    )}
                    {platform === "desktop" && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 mb-3">
                        <Monitor className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-100/90 leading-relaxed">
                          Tu navegador soporta instalación directa. Toca el botón y aparecerá el diálogo de Chrome/Edge.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={handleInstallNative}
                      disabled={installing}
                      className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${titleColor} text-[#0a0a14] font-semibold hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg`}
                    >
                      {installing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Abriendo diálogo...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Instalar automáticamente
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-white/40 mt-2">
                      Aparecerá el diálogo nativo del navegador
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Separador "o" */}
            {!manualOnly && installResult !== "accepted" && (
              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-white/40 font-medium">o instala manualmente</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>
            )}

            {/* ========================================
                Instrucciones manuales según plataforma
                ======================================== */}
            {platform === "ios" && (
              <div className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                  <Apple className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-100/90 leading-relaxed">
                    iPhone/iPad no soporta instalación directa. Sigue estos pasos para agregar MenuPro a tu pantalla de inicio.
                  </p>
                </div>

                <ol className="space-y-3">
                  <Step
                    num={1}
                    icon={<Share className="w-4 h-4" />}
                    title="Toca el botón Compartir"
                    desc="Está en la barra inferior de Safari (cuadrado con flecha hacia arriba)."
                  />
                  <Step
                    num={2}
                    icon={<Plus className="w-4 h-4" />}
                    title="Selecciona 'Añadir a pantalla de inicio'"
                    desc="Desplázate hacia abajo en la hoja de acciones y toca esa opción."
                  />
                  <Step
                    num={3}
                    icon={<Check className="w-4 h-4" />}
                    title="Confirma"
                    desc="Toca 'Añadir' en la esquina superior derecha. ¡Listo! Tendrás el ícono en tu pantalla de inicio."
                  />
                </ol>

                <div className="text-center text-xs text-white/40 pt-2">
                  Una vez instalada, abrirá en pantalla completa, sin la barra del navegador.
                </div>
              </div>
            )}

            {platform === "android" && (
              <div className="space-y-4">
                <ol className="space-y-3">
                  <Step
                    num={1}
                    icon={<Download className="w-4 h-4" />}
                    title="Menú de Chrome (⋮)"
                    desc="Toca los tres puntos en la esquina superior derecha del navegador."
                  />
                  <Step
                    num={2}
                    icon={<Plus className="w-4 h-4" />}
                    title="Selecciona 'Instalar aplicación' o 'Añadir a pantalla de inicio'"
                    desc="Está en el menú desplegable."
                  />
                  <Step
                    num={3}
                    icon={<Check className="w-4 h-4" />}
                    title="Confirma"
                    desc="Toca 'Instalar' en el diálogo. El ícono aparecerá en tu launcher."
                  />
                </ol>
              </div>
            )}

            {platform === "desktop" && (
              <div className="space-y-4">
                <ol className="space-y-3">
                  <Step
                    num={1}
                    icon={<Download className="w-4 h-4" />}
                    title="Busca el ícono de instalación"
                    desc="Aparece en la barra de direcciones (a la derecha de la URL). Es un ícono con un + o un monitor con flecha hacia abajo."
                  />
                  <Step
                    num={2}
                    icon={<Plus className="w-4 h-4" />}
                    title="Haz clic y selecciona 'Instalar'"
                    desc="Aparecerá un diálogo de confirmación."
                  />
                  <Step
                    num={3}
                    icon={<Check className="w-4 h-4" />}
                    title="¡Listo!"
                    desc="MenuPro se abrirá en su propia ventana, sin pestañas del navegador. Podrás fijarla en tu taskbar/dock."
                  />
                </ol>

                <div className="text-center text-xs text-white/40 pt-2">
                  También desde el menú ⋮ → "Instalar MenuPro..."
                </div>
              </div>
            )}

            {platform === "other" && (
              <div className="space-y-3 text-sm text-white/70">
                <p>Tu navegador no soporta instalación directa de PWAs.</p>
                <p className="text-white/50 text-xs">
                  Te recomendamos abrir esta página en Chrome, Edge o Safari para poder instalar MenuPro como aplicación.
                </p>
              </div>
            )}

            {/* CTA cerrar */}
            <button
              onClick={handleClose}
              className={`mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r ${titleColor} text-[#0a0a14] font-semibold hover:opacity-90 transition`}
            >
              {installResult === "accepted" ? "¡Listo!" : "Cerrar"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">
          <span className="text-white/40 mr-1.5">{num}.</span>
          {title}
        </div>
        <div className="text-xs text-white/55 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </li>
  );
}
