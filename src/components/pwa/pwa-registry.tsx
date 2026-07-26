"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, RefreshCw, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "menupro_pwa_install_dismissed_at";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

export default function PwaRegistry() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // ============================================================
  // 1) Registrar Service Worker
  // ============================================================
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return; // Solo en producción

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        setRegistration(reg);
        console.log("[PWA] SW registrado:", reg.scope);

        // Detectar updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Hay una nueva versión disponible
              setShowUpdateBanner(true);
            }
          });
        });

        // Si ya hay un SW esperando, mostrar banner de update
        if (reg.waiting && navigator.serviceWorker.controller) {
          setShowUpdateBanner(true);
        }
      } catch (err) {
        console.warn("[PWA] No se pudo registrar el SW:", err);
      }
    };

    register();

    // Listener para updates manuales
    const handleControllerChange = () => {
      // El nuevo SW tomó control — recargar página
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  // ============================================================
  // 2) Capturar evento beforeinstallprompt (Chrome/Android/Edge)
  // ============================================================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: Event) => {
      e.preventDefault(); // Prevenir el mini-infobar automático
      setInstallEvent(e as BeforeInstallPromptEvent);

      // Solo mostrar si no fue dismissado recientemente
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      const isRecent =
        dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;
      if (!isRecent) {
        // Pequeño delay para no interrumpir la carga inicial
        setTimeout(() => setShowInstallBanner(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ============================================================
  // 3) Detectar online/offline (banner superior)
  // ============================================================
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsOffline(!navigator.onLine);
    update();
    window.addEventListener("online", () => {
      setIsOffline(false);
      toast.success("🌐 Conexión restablecida");
    });
    window.addEventListener("offline", () => {
      setIsOffline(true);
      toast.warning("📡 Sin conexión — modo offline activado");
    });
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  // ============================================================
  // 4) Acciones del banner de instalación
  // ============================================================
  const handleInstallClick = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("✅ MenuPro instalado. Ahora está en tu pantalla de inicio.");
      } else {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
      }
      setInstallEvent(null);
      setShowInstallBanner(false);
    } catch (err) {
      console.error("[PWA] Error al instalar:", err);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  // ============================================================
  // 5) Acción del banner de update
  // ============================================================
  const handleUpdate = async () => {
    if (!registration?.waiting) return;
    // Enviar mensaje al SW para que haga skipWaiting
    registration.waiting.postMessage("SKIP_WAITING");
    // El listener de controllerchange recargará la página automáticamente
  };

  return (
    <>
      {/* Banner Offline (arriba) */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span>Sin conexión — navegando en modo offline</span>
        </div>
      )}

      {/* Banner de actualización disponible */}
      {showUpdateBanner && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md mx-4">
          <RefreshCw className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Nueva versión disponible</p>
            <p className="text-xs opacity-90">Recarga para obtener las últimas mejoras.</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleUpdate}
            className="bg-white text-orange-600 hover:bg-white/90"
          >
            Actualizar
          </Button>
          <button
            onClick={() => setShowUpdateBanner(false)}
            className="text-white/80 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Banner de instalación (bottom) */}
      {showInstallBanner && installEvent && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[70] bg-[#1a1a2e] border border-orange-500/30 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-bold text-lg flex-shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Instalar MenuPro</p>
            <p className="text-xs text-white/60 truncate">
              Acceso rápido desde tu pantalla de inicio.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white"
          >
            <Download className="w-4 h-4 mr-1" />
            Instalar
          </Button>
          <button
            onClick={handleDismiss}
            className="text-white/50 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
