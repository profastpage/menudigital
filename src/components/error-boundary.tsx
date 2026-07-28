'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { reportError } from '@/lib/error-reporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary global.
 *
 * Uso en layout.tsx:
 *   <ErrorBoundary>
 *     {children}
 *   </ErrorBoundary>
 *
 * Si ocurre un error no capturado en cualquier componente hijo,
 * se reporta automáticamente a Sentry (si está configurado) y
 * muestra un fallback con opción de recargar la página.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Reportar a Sentry (async, no bloquea render)
    void reportError(error, {
      level: 'error',
      tags: { source: 'error-boundary' },
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Si el padre proveyó un fallback custom, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#07070b] text-white p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl">😕</div>
            <h1 className="text-2xl font-bold">
              Algo salió mal
            </h1>
            <p className="text-white/60 text-sm leading-relaxed">
              Ocurrió un error inesperado. Ya nos llegó la notificación automática
              y lo revisaremos. Puedes intentar recargar la página.
            </p>
            {this.state.error && (
              <details className="text-left bg-white/5 border border-white/10 rounded-lg p-4 text-xs text-white/60">
                <summary className="cursor-pointer text-white/80">
                  Detalle técnico
                </summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] font-semibold rounded-lg hover:opacity-90 transition"
              >
                Recargar página
              </button>
              <a
                href="/"
                className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition"
              >
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
