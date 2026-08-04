'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Sparkles,
  Crown,
  Gift,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface EligibilityData {
  show_premium_trial: boolean;
  show_full_trial: boolean;
  premium_days: number;
  full_days: number;
  current_plan: string;
  dismissed_age_days: number;
  reason?: string;
}

/**
 * TrialPromoBanner
 *
 * Banner que se muestra a usuarios Free/Pro invitándolos a probar
 * Premium (5 días) o Full (10 días) gratis sin tarjeta.
 *
 * - Se muestra solo si check_trial_eligibility dice que sí
 * - Aparece aleatoriamente (50% de las veces) para no ser invasivo
 * - Si el usuario lo cierra, no se vuelve a mostrar por 7 días
 * - Si acepta, se llama a /api/billing/trial/start
 *   y el plan cambia automáticamente por N días
 */
export function TrialPromoBanner({ planId }: { planId: string }) {
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<'premium' | 'full' | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Solo mostrar para Free y Pro
    if (planId !== 'free' && planId !== 'pro') {
      setLoading(false);
      return;
    }

    // Aleatorio: 50% de las veces muestra la promo (cuando es eligible)
    // para no ser invasivo — el usuario dijo "algunas veces aparece y a veces no"
    const shouldCheck = Math.random() < 0.5;
    if (!shouldCheck) {
      setLoading(false);
      return;
    }

    fetch('/api/billing/trial/eligibility')
      .then((r) => r.json())
      .then((data) => {
        setEligibility(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [planId]);

  const startTrial = async (plan: 'premium' | 'full') => {
    setStarting(plan);
    try {
      const res = await fetch('/api/billing/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, withCard: false }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar trial');

      toast.success(`¡Trial ${plan.toUpperCase()} activado! Tienes ${plan === 'premium' ? 5 : 10} días gratis.`, {
        duration: 5000,
      });

      // Recargar para reflejar el nuevo plan
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al iniciar trial');
    } finally {
      setStarting(null);
    }
  };

  const dismiss = async () => {
    setHidden(true);
    try {
      await fetch('/api/billing/trial/dismiss', { method: 'POST' });
    } catch {
      // best-effort
    }
  };

  if (loading || hidden || !eligibility) return null;
  if (!eligibility.show_premium_trial && !eligibility.show_full_trial) return null;

  // Decidir qué trial mostrar (priorizar Full si está disponible, sino Premium)
  const showFull = eligibility.show_full_trial;
  const trialPlan: 'premium' | 'full' = showFull ? 'full' : 'premium';
  const trialDays = showFull ? eligibility.full_days : eligibility.premium_days;
  const planName = showFull ? 'Full' : 'Premium';
  const planPrice = showFull ? 'S/ 199' : 'S/ 99';
  const planColor = showFull ? '#e63946' : '#9d4edd';

  return (
    <div
      className="relative rounded-2xl overflow-hidden border p-5 sm:p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${planColor}15, transparent 60%), linear-gradient(225deg, ${planColor}10, transparent 60%)`,
        borderColor: `${planColor}40`,
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={dismiss}
        aria-label="Cerrar promo"
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        {/* Icon */}
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${planColor}25`, border: `1px solid ${planColor}50` }}
        >
          <Gift className="w-7 h-7 sm:w-8 sm:h-8" style={{ color: planColor }} />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: `${planColor}25`, color: planColor, border: `1px solid ${planColor}40` }}
            >
              <Sparkles className="w-3 h-3" />
              Oferta especial · {trialDays} días gratis
            </span>
            <span className="text-[10px] text-white/40">Sin tarjeta</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Prueba el plan {planName} ({planPrice}/mes) sin pagar nada
          </h3>
          <p className="text-xs sm:text-sm text-white/60">
            {showFull ? (
              <>
                Desbloquea <strong>menús ilimitados</strong>, <strong>10 fotos por plato</strong>,{' '}
                <strong>multi-sucursal</strong>, <strong>voucher printing POS</strong> y más durante {trialDays} días.
                Al terminar, vuelves a tu plan actual sin cobros sorpresa.
              </>
            ) : (
              <>
                Desbloquea <strong>mesas y mozos</strong>, <strong>comandas</strong>, <strong>cocina display</strong>,{' '}
                <strong>inventario</strong> y <strong>white label</strong> durante {trialDays} días. Al terminar,
                vuelves a tu plan actual sin cobros sorpresa.
              </>
            )}
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs text-white/50">
            <li className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: planColor }} />
              Sin tarjeta de crédito
            </li>
            <li className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: planColor }} />
              Cancela cuando quieras
            </li>
            <li className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" style={{ color: planColor }} />
              Datos guardados
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-2 sm:flex-shrink-0">
          <Button
            onClick={() => startTrial(trialPlan)}
            disabled={starting !== null}
            className="font-bold text-sm sm:text-base h-11 px-5"
            style={{
              background: `linear-gradient(135deg, ${planColor}, ${planColor}cc)`,
              color: 'white',
            }}
          >
            {starting === trialPlan ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activando...
              </>
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Probar {trialDays} días gratis
              </>
            )}
          </Button>
          <Link
            href="/dashboard/billing"
            className="text-[10px] sm:text-xs text-white/50 hover:text-white text-center underline"
          >
            Ver todos los planes
          </Link>
        </div>
      </div>
    </div>
  );
}
