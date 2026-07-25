'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Check,
  Loader2,
  Crown,
  Sparkles,
  CreditCard,
  XOctagon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PLANS } from '@/lib/plans';
import type { Plan } from '@/lib/plans';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

interface Props {
  user: { email: string; name: string };
  plan: Plan;
  isSuperAdmin?: boolean;
  profile: {
    plan: 'free' | 'pro';
    email: string;
    currentPeriodEnd: string | null;
    mpStatus: string | null;
    mpPreapprovalId: string | null;
  };
  usage: { menusCount: number; imagesCount: number };
  queryParams: { success?: string; canceled?: string };
}

export function BillingClient({ user, plan, isSuperAdmin = false, profile, usage, queryParams }: Props) {
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const currentPlan = PLANS[profile.plan];

  useEffect(() => {
    if (queryParams.success === '1') {
      toast.success('¡Gracias! Estamos confirmando tu pago con MercadoPago…');
      setTimeout(() => window.location.reload(), 2500);
    }
    if (queryParams.canceled === '1') {
      toast.info('Pago cancelado. Puedes intentar nuevamente cuando quieras.');
    }
  }, [queryParams]);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/mercadopago/checkout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch('/api/mercadopago/cancel', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      toast.success('Suscripción cancelada. Conservarás Pro hasta fin de período.');
      setConfirmCancel(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setCancelLoading(false);
    }
  }

  return (
    <DashboardShell user={user} plan={plan} isSuperAdmin={isSuperAdmin}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Planes y facturación</h1>
        <p className="text-white/60 text-sm sm:text-base">
          Estás en el plan{' '}
          <span className="text-[#d4af37] font-semibold">{currentPlan.name}</span>
          {profile.plan === 'pro' && profile.currentPeriodEnd && (
            <span className="ml-2">
              · Renueva el{' '}
              {new Date(profile.currentPeriodEnd).toLocaleDateString('es-PE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          )}
          {profile.mpStatus && profile.mpStatus !== 'authorized' && (
            <span className="ml-2 text-white/40">(estado MP: {profile.mpStatus})</span>
          )}
        </p>
      </div>

      {/* Usage cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-[#d4af37]">
            {usage.menusCount}
            <span className="text-lg sm:text-xl text-white/40">
              /{currentPlan.limits.maxMenus === -1 ? '∞' : currentPlan.limits.maxMenus}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-white/60 mt-1">Menús</div>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6 text-center">
          <div className="text-3xl sm:text-4xl font-bold text-[#d4af37]">
            {usage.imagesCount}
            <span className="text-lg sm:text-xl text-white/40">
              /{currentPlan.limits.maxImages === -1 ? '∞' : currentPlan.limits.maxImages}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-white/60 mt-1">Imágenes</div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-10">
        {/* Free */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold">Free</h3>
            {profile.plan === 'free' && (
              <span className="px-2 sm:px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-semibold">
                Plan actual
              </span>
            )}
          </div>
          <div className="mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl font-bold">S/ 0</span>
            <span className="text-white/50 text-sm sm:text-base">/mes</span>
          </div>
          <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            {PLANS.free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-white/80">
                <Check className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button
            disabled
            variant="outline"
            className="w-full bg-transparent border-white/10 text-white/40 cursor-not-allowed"
          >
            {profile.plan === 'free' ? 'Plan actual' : 'Bajar de plan'}
          </Button>
        </div>

        {/* Pro */}
        <div className="relative bg-gradient-to-b from-[#d4af37]/10 to-[#15152a] border border-[#d4af37]/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 px-2 sm:px-3 py-1 rounded-bl-xl bg-[#d4af37] text-[#1a1a2e] text-[10px] sm:text-xs font-bold">
            RECOMENDADO
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#d4af37]" />
              <h3 className="text-lg sm:text-xl font-bold">Pro</h3>
            </div>
            {profile.plan === 'pro' && (
              <span className="px-2 sm:px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-[10px] sm:text-xs font-semibold">
                Plan actual
              </span>
            )}
          </div>
          <div className="mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl font-bold">S/ 35</span>
            <span className="text-white/50 text-sm sm:text-base">/mes</span>
            <div className="text-[10px] sm:text-xs text-white/40 mt-1">
              ≈ $9 USD · Cobrado por MercadoPago
            </div>
          </div>
          <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            {PLANS.pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs sm:text-sm text-white">
                <Check className="w-4 h-4 text-[#d4af37] mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {profile.plan === 'free' ? (
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#d4af37] to-[#f4d35e] text-[#1a1a2e] hover:opacity-90 font-semibold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Upgrade a Pro con MercadoPago
            </Button>
          ) : !confirmCancel ? (
            <Button
              onClick={() => setConfirmCancel(true)}
              variant="outline"
              className="w-full bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              <XOctagon className="w-4 h-4 mr-2" />
              Cancelar suscripción
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-white/80 text-center">
                ¿Cancelar ahora? Conservarás acceso Pro hasta el fin del período pagado.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setConfirmCancel(false)}
                  variant="outline"
                  className="bg-transparent border-white/20 text-white hover:bg-white/5 text-xs sm:text-sm"
                >
                  No, seguir Pro
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={cancelLoading}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm"
                >
                  {cancelLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sí, cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment methods info */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 mb-8">
        <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#00b1ea] flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-white/70">
          <div className="font-semibold text-white mb-1">
            Pagos procesados por MercadoPago
          </div>
          Aceptamos tarjetas Visa, Mastercard, American Express, Diners, Yape, Plin y otros métodos según tu país. El cobro es mensual y puedes cancelar cuando quieras.
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-4">
        <h3 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Preguntas frecuentes</h3>
        <div className="space-y-3 sm:space-y-4 text-left">
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 sm:p-5">
            <div className="font-semibold mb-1 text-sm sm:text-base">
              ¿Puedo cancelar cuando quiera?
            </div>
            <div className="text-xs sm:text-sm text-white/60">
              Sí. Haz clic en &quot;Cancelar suscripción&quot; y confirma. El cobro recurrente se detiene, pero conservarás acceso Pro hasta el fin del período que ya pagaste.
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 sm:p-5">
            <div className="font-semibold mb-1 text-sm sm:text-base">
              ¿Qué métodos de pago aceptan?
            </div>
            <div className="text-xs sm:text-sm text-white/60">
              Todos los que soporta MercadoPago en tu país: tarjetas de crédito/débito, Yape, Plin, pago en efectivo en agentes autorizados y más.
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 sm:p-5">
            <div className="font-semibold mb-1 text-sm sm:text-base">
              ¿Hay comisión por venta?
            </div>
            <div className="text-xs sm:text-sm text-white/60">
              No. Los pedidos van directo al WhatsApp del restaurante. MenuPro no cobra comisión por venta — solo la suscripción mensual fija de S/35.
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 sm:p-5">
            <div className="font-semibold mb-1 text-sm sm:text-base">
              Mi pago dice &quot;pendiente&quot;
            </div>
            <div className="text-xs sm:text-sm text-white/60">
              Si pagaste con método efectivo (ej. Yape/Plin) la activación es inmediata. Si elegiste transferencia o agente, puede tardar hasta 2 horas hábiles en confirmarse.
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
