'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UtensilsCrossed, ArrowRight, QrCode, KeyRound, ExternalLink, AlertCircle } from 'lucide-react';

/**
 * Página landing pública para /mozo (sin token).
 *
 * Antes esto devolvía 404 y confundía a los mozos (que escribían "menudigital.pro/mozo"
 * sin saber su token único). Ahora muestra una página amigable que:
 *
 *  1. Explica qué es el panel del mozo y cómo se accede (QR o enlace único).
 *  2. Permite pegar el enlace completo o solo el token para redirigir automáticamente.
 *  3. Deja claro que NO requiere iniciar sesión con la cuenta del dueño — el acceso
 *     es externo y se valida solo con el token + (opcionalmente) la contraseña que
 *     el dueño configuró desde /dashboard/mozos.
 *
 * Importante: el panel del mozo es una URL EXTERNA. El dueño la comparte por QR o
 * copiando el enlace desde su dashboard. El mozo NUNCA necesita loguearse con la
 * cuenta del dueño.
 */
export function MozoLanding() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const raw = input.trim();
    if (!raw) {
      setError('Pega tu enlace o escribe tu código de acceso.');
      return;
    }

    // Acepta varias formas de input:
    //  - https://menudigital.pro/mozo/abc123def...
    //  - /mozo/abc123def...
    //  - mozo/abc123def...
    //  - abc123def... (solo el token)
    let token = raw;

    // Si es URL completa, extraer la última parte del path
    try {
      const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, window.location.origin);
      const parts = url.pathname.split('/').filter(Boolean);
      const mozoIdx = parts.findIndex((p) => p === 'mozo');
      if (mozoIdx !== -1 && parts[mozoIdx + 1]) {
        token = parts[mozoIdx + 1];
      } else if (parts.length === 1) {
        // Solo el token en el path
        token = parts[0];
      }
    } catch {
      // Si no es URL válida, usar como token directo
    }

    // Validación mínima: el token debe ser un hex/string razonable (16+ chars en producción)
    if (token.length < 8) {
      setError('El código de acceso parece muy corto. Verifica que lo copiaste completo.');
      return;
    }

    // Sanitizar (solo alfanumérico)
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      setError('El código contiene caracteres inválidos. Copia el enlace completo desde el QR.');
      return;
    }

    // Redirigir al panel del mozo
    router.push(`/mozo/${token}`);
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white flex flex-col">
      {/* Header minimal */}
      <header className="border-b border-white/10 bg-[#0a0a14]/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition">
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="MenuPro"
                width={28}
                height={28}
                className="rounded-lg"
                style={{ width: 28, height: 28 }}
              />
            </picture>
            <span className="font-bold text-sm">MenuPro</span>
          </Link>
          <Link
            href="/login"
            className="text-xs text-white/60 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            Soy dueño →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Icono */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#9d4edd] to-[#c77dff] flex items-center justify-center shadow-lg shadow-[#9d4edd]/30">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">
            Panel del Mozo
          </h1>
          <p className="text-white/60 text-center text-sm mb-8">
            Ingresa con tu enlace único o código QR.
            <br />
            <span className="text-white/40">No necesitas iniciar sesión con la cuenta del dueño.</span>
          </p>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4"
          >
            <div>
              <label htmlFor="mozo-access" className="text-xs text-white/70 font-medium mb-2 block">
                Pega tu enlace o código de acceso
              </label>
              <input
                id="mozo-access"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="https://menudigital.pro/mozo/..."
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#9d4edd]/50 focus:bg-white/[0.07] transition"
                autoFocus
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#9d4edd] to-[#c77dff] text-white font-semibold py-3 rounded-xl hover:opacity-95 transition active:scale-[0.98] flex items-center justify-center gap-2 min-h-[44px]"
            >
              Ingresar al panel
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Info cards */}
          <div className="mt-6 space-y-2.5">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#9d4edd]/15 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-4 h-4 text-[#9d4edd]" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white/90 mb-0.5">¿Cómo obtengo mi acceso?</div>
                <div className="text-white/50 leading-relaxed">
                  Escanea el QR que te dio el dueño del restaurante, o pega el enlace que te compartió.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 text-[#d4af37]" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white/90 mb-0.5">¿Pide contraseña?</div>
                <div className="text-white/50 leading-relaxed">
                  Algunos restaurantes protegen el panel con una contraseña adicional. Pídela al dueño si la necesitas.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-[#06d6a0]/15 flex items-center justify-center flex-shrink-0">
                <ExternalLink className="w-4 h-4 text-[#06d6a0]" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-white/90 mb-0.5">Acceso externo</div>
                <div className="text-white/50 leading-relaxed">
                  Tu enlace funciona en cualquier dispositivo: celular, tablet o computadora. Puedes guardarlo como app (Agregar a pantalla de inicio).
                </div>
              </div>
            </div>
          </div>

          {/* Footer help */}
          <div className="mt-6 text-center text-[11px] text-white/30 leading-relaxed">
            ¿No tienes tu enlace? Pídelo al dueño o administrador del restaurante.
            <br />
            <Link href="/" className="text-white/40 hover:text-white/60 transition underline underline-offset-2">
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
