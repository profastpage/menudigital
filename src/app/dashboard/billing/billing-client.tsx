'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { PLANS } from '@/lib/plans';

interface Props {
  profile: {
    plan: 'free' | 'pro';
    email: string;
    currentPeriodEnd: string | null;
    stripeCustomerId: string | null;
  };
  usage: { menusCount: number; imagesCount: number };
  queryParams: { success?: string; canceled?: string };
}

export function BillingClient({ profile, usage, queryParams }: Props) {
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const currentPlan = PLANS[profile.plan];

  useEffect(() => {
    if (queryParams.success === '1') {
      toast.success('¡Bienvenido a Pro! Tu suscripción está activa.');
    }
    if (queryParams.canceled === '1') {
      toast.info('Pago cancelado. Puedes intentar nuevamente cuando quieras.');
    }
  }, [queryParams]);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
      setPortalLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07070b] text-white">
      <header className="border-b border-white/10 bg-[#0a0a14]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/dashboard" className="flex items-center gap-3 text-white/70 hover:text-white">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#d4af37] to-[#f4d35e] flex items-center justify-center text-lg font-bold text-[#1a1a2e]">
              M
            </div>
            <span className="font-semibold">MenuPro</span>
          </a>
          <a
            href="/dashboard"
            className="text-sm text-white/60 hover:text-white"
          >
            ← Volver al dashboard
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Planes y facturación</h1>
          <p className="text-white/60">
            Estás en el plan <span className="text-[#d4af37] font-semibold">{currentPlan.name}</span>
            {profile.plan === 'pro' && profile.currentPeriodEnd && (
              <span className="ml-2">
                · Renueva el {new Date(profile.currentPeriodEnd).toLocaleDateString('es-PE', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </p>
        </div>

        {/* Usage */}
        <div className="grid grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-[#d4af37]">
              {usage.menusCount}
              <span className="text-lg text-white/40">
                /{currentPlan.limits.maxMenus === -1 ? '∞' : currentPlan.limits.maxMenus}
              </span>
            </div>
            <div className="text-sm text-white/60 mt-1">Menús</div>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-[#d4af37]">
              {usage.imagesCount}
              <span className="text-lg text-white/40">
                /{currentPlan.limits.maxImages}
              </span>
            </div>
            <div className="text-sm text-white/60 mt-1">Imágenes</div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Free</h3>
              {profile.plan === 'free' && (
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold">
                  Plan actual
                </span>
              )}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">S/ 0</span>
              <span className="text-white/50">/mes</span>
            </div>
            <ul className="space-y-3 mb-8">
              {PLANS.free.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/80">
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
          <div className="relative bg-gradient-to-b from-[#d4af37]/10 to-[#15152a] border border-[#d4af37]/40 rounded-3xl p-8 overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-[#d4af37] text-[#1a1a2e] text-xs font-bold">
              RECOMENDADO
            </div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-xl font-bold">Pro</h3>
              </div>
              {profile.plan === 'pro' && (
                <span className="px-3 py-1 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] text-xs font-semibold">
                  Plan actual
                </span>
              )}
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">S/ 35</span>
              <span className="text-white/50">/mes</span>
              <div className="text-xs text-white/40 mt-1">≈ $9 USD</div>
            </div>
            <ul className="space-y-3 mb-8">
              {PLANS.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white">
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
                Upgrade a Pro
              </Button>
            ) : (
              <Button
                onClick={handlePortal}
                disabled={portalLoading}
                variant="outline"
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/5"
              >
                {portalLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Administrar suscripción
              </Button>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h3 className="text-2xl font-bold mb-6">Preguntas frecuentes</h3>
          <div className="space-y-4 text-left">
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <div className="font-semibold mb-1">¿Puedo cancelar cuando quiera?</div>
              <div className="text-sm text-white/60">
                Sí, puedes cancelar en cualquier momento desde el portal de Stripe.
                Conservarás acceso Pro hasta el fin del período pagado.
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <div className="font-semibold mb-1">¿Qué métodos de pago aceptan?</div>
              <div className="text-sm text-white/60">
                Aceptamos tarjetas Visa, Mastercard, American Express y otras a través de Stripe.
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
              <div className="font-semibold mb-1">¿Hay comisión por venta?</div>
              <div className="text-sm text-white/60">
                No. Los pedidos van directo al WhatsApp del restaurante. MenuPro no cobra
                comisión por venta.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
