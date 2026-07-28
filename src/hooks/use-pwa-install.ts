"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export type Platform = "ios" | "android" | "desktop" | "other";
export type InstallState = "available" | "installed" | "unsupported" | "dismissed";

const DISMISS_KEY = "menupro_install_dismissed_at";
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 días

// ============================================================
// SINGLETON GLOBAL: capturar el evento beforeinstallprompt
// a nivel de window para que cualquier componente pueda usarlo,
// incluso si se monta DESPUÉS de que se disparó el evento.
// ============================================================
type GlobalState = {
  installEvent: BeforeInstallPromptEvent | null;
  listeners: Set<() => void>;
  hasListener: boolean;
};

declare global {
  interface Window {
    __menuproPwaState?: GlobalState;
  }
}

function getGlobalState(): GlobalState {
  if (typeof window === "undefined") {
    return { installEvent: null, listeners: new Set(), hasListener: false };
  }
  if (!window.__menuproPwaState) {
    window.__menuproPwaState = {
      installEvent: null,
      listeners: new Set(),
      hasListener: false,
    };
  }
  return window.__menuproPwaState;
}

function ensureGlobalListener() {
  const gs = getGlobalState();
  if (gs.hasListener || typeof window === "undefined") return;

  gs.hasListener = true;

  // Capturar beforeinstallprompt (Chrome/Android/Edge/Brave)
  // CRÍTICO: preventDefault() impide que el navegador muestre el banner
  // automático — nosotros lo mostramos cuando queramos vía prompt().
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    const ev = e as BeforeInstallPromptEvent;
    gs.installEvent = ev;
    console.info("[PWA] beforeinstallprompt capturado ✓ — listo para prompt()");
    // Notificar a todos los hooks
    gs.listeners.forEach((fn) => fn());
  });

  // Detectar cuando se instala exitosamente
  window.addEventListener("appinstalled", () => {
    console.info("[PWA] appinstalled ✓ — la PWA fue instalada");
    gs.installEvent = null;
    gs.listeners.forEach((fn) => fn());
  });
}

/**
 * Hook que detecta plataforma, estado de instalación y evento beforeinstallprompt.
 *
 * Usa un singleton global para que el evento beforeinstallprompt se capture
 * una sola vez a nivel de window, sin importar cuántas instancias del hook
 * existan o cuándo se monten.
 */
export function usePwaInstall() {
  const [platform, setPlatform] = useState<Platform>("other");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [state, setState] = useState<InstallState>("unsupported");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const mountedRef = useRef(false);

  // ========================================
  // 1) Detectar plataforma y modo standalone
  // ========================================
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);
    const isDesktop = !isIOS && !isAndroid;
    setPlatform(isIOS ? "ios" : isAndroid ? "android" : isDesktop ? "desktop" : "other");

    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.matchMedia?.("(display-mode: window-controls-overlay)")?.matches ||
      (window.navigator as { standalone?: boolean })?.standalone === true;
    setIsStandalone(Boolean(standalone));

    // Debug info para diagnosticar
    const dbg = [
      `ua=${ua.slice(0, 60)}`,
      `platform=${isIOS ? "ios" : isAndroid ? "android" : isDesktop ? "desktop" : "other"}`,
      `standalone=${standalone}`,
      `protocol=${window.location.protocol}`,
      `sw=${"serviceWorker" in navigator ? "yes" : "no"}`,
    ].join(" | ");
    setDebugInfo(dbg);
    console.info("[PWA] Debug:", dbg);

    if (standalone) {
      setState("installed");
      return;
    }

    // Si fue dismissado recientemente, no mostrar
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS) {
      setState("dismissed");
      console.info("[PWA] Estado: dismissed (recientemente cerrado)");
    } else {
      // Inicialmente unsupported hasta que sepamos más
      setState("unsupported");
    }
  }, []);

  // ========================================
  // 2) Suscribirse al singleton global
  // ========================================
  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureGlobalListener();
    const gs = getGlobalState();

    // Sincronizar estado inicial
    setInstallEvent(gs.installEvent);

    const update = () => {
      setInstallEvent(gs.installEvent);
      // Si llegó el evento y no estábamos dismissados ni instalados, marcar como available
      if (gs.installEvent) {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        const isDismissed = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;
        if (!isDismissed && state !== "installed") {
          setState("available");
        }
      } else {
        // Si no hay evento pero antes había → ya se usó o se instaló
        if (state === "available") {
          // Verificar si se instaló
          const standalone =
            window.matchMedia?.("(display-mode: standalone)")?.matches ||
            (window.navigator as { standalone?: boolean })?.standalone === true;
          if (standalone) {
            setState("installed");
          }
        }
      }
    };

    gs.listeners.add(update);
    mountedRef.current = true;
    update();

    return () => {
      gs.listeners.delete(update);
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // ========================================
  // 3) Para iOS, marcar como available (instrucciones manuales)
  // ========================================
  useEffect(() => {
    if (platform === "ios" && !isStandalone && state === "unsupported") {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt || Date.now() - parseInt(dismissedAt, 10) > DISMISS_DURATION_MS) {
        setState("available");
      } else {
        setState("dismissed");
      }
    }
    // Para Android/desktop: si después de 5s no llegó beforeinstallprompt,
    // asumimos que el navegador no va a dispararlo (engagement insuficiente,
    // app ya instalada antes, etc.) — el botón de instalar mostrará
    // instrucciones manuales como fallback.
    if ((platform === "android" || platform === "desktop") && state === "unsupported") {
      const t = setTimeout(() => {
        if (!getGlobalState().installEvent) {
          console.info("[PWA] after 5s — beforeinstallprompt NO llegó, fallback a instrucciones manuales");
        }
      }, 5000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, isStandalone]);

  // ========================================
  // 4) Acción: disparar prompt nativo
  // ========================================
  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "manual" | "failed" | "no-event"
  > => {
    console.info("[PWA] promptInstall llamado — platform:", platform);

    // iOS no soporta prompt nativo — siempre devolver "manual"
    if (platform === "ios") {
      return "manual";
    }

    // Intentar leer el evento desde el singleton global (puede haber llegado
    // a otra instancia del hook o antes de que esta se montara)
    const gs = getGlobalState();
    const evt = gs.installEvent || installEvent;
    if (!evt) {
      console.info("[PWA] No hay beforeinstallprompt event disponible — fallback a instrucciones manuales");
      return "no-event";
    }

    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      gs.installEvent = null;
      setInstallEvent(null);
      // Notificar
      gs.listeners.forEach((fn) => fn());

      if (choice.outcome === "accepted") {
        setState("installed");
        return "accepted";
      } else {
        localStorage.setItem(DISMISS_KEY, Date.now().toString());
        setState("dismissed");
        return "dismissed";
      }
    } catch (err) {
      console.error("[PWA] Error en prompt():", err);
      return "failed";
    }
  }, [installEvent, platform]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setState("dismissed");
  }, []);

  return {
    platform,
    state, // "available" | "installed" | "unsupported" | "dismissed"
    isStandalone,
    canInstall: state === "available" && (platform === "ios" || !!installEvent || !!getGlobalState().installEvent),
    needsManualInstructions: platform === "ios" && state === "available",
    promptInstall,
    dismiss,
    debugInfo,
  };
}
