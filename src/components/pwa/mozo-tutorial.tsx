'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Check,
  Smartphone, Utensils, Send, WifiOff,
  CloudUpload, ShoppingCart, ClipboardList,
  HelpCircle, BookOpen, Play,
} from 'lucide-react';
import { type PlanId, isPlanAtLeast } from '@/lib/plans';

interface Props {
  open: boolean;
  onClose: () => void;
  waiterName?: string;
  planId?: PlanId;
}

interface TutorialStep {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  icon: typeof Utensils;
  content: React.ReactNode;
}

export function MozoTutorial({ open, onClose, waiterName, planId }: Props) {
  const [step, setStep] = useState(0);

  const hasOffline = planId ? isPlanAtLeast(planId, 'premium') : false;
  const hasBackgroundSync = planId ? isPlanAtLeast(planId, 'full') : false;

  const steps: TutorialStep[] = [
    // Paso 1: Bienvenida
    {
      id: 'welcome',
      emoji: '👋',
      title: waiterName ? `¡Hola, ${waiterName}!` : '¡Bienvenido!',
      subtitle: 'Tu panel de mozo en 4 pasos',
      icon: HelpCircle,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">
            Este panel te permite <strong className="text-white">tomar comandas</strong>, enviarlas a cocina
            y seguir su estado — todo desde tu celular.
          </p>
          <div className="bg-[#9d4edd]/10 border border-[#9d4edd]/20 rounded-xl p-3">
            <div className="text-xs font-semibold text-[#c77dff] mb-1">⏱️ Tiempo: 2 minutos</div>
            <div className="text-xs text-white/60">
              Al terminar sabrás tomar pedidos, enviarlos y (si tu plan lo permite) trabajar sin internet.
            </div>
          </div>
        </div>
      ),
    },
    // Paso 2: Tomar comanda
    {
      id: 'take-order',
      emoji: '🛒',
      title: 'Tomar una comanda',
      subtitle: 'Selecciona mesa, platos y cantidades',
      icon: ShoppingCart,
      content: (
        <div className="space-y-3">
          <ol className="space-y-2.5 text-sm">
            <StepItem
              num={1}
              text={
                <>
                  En la pestaña <strong className="text-white">"Mesas"</strong>, toca la mesa donde está el cliente.
                  Las mesas <span className="text-emerald-400">verdes</span> están libres, las <span className="text-amber-400">amarillas</span> ocupadas.
                </>
              }
            />
            <StepItem
              num={2}
              text={
                <>
                  Se abrirá el <strong className="text-white">menú del restaurante</strong>. Toca los platos para agregarlos al carrito.
                  Usa <strong className="text-white">+/-</strong> para cambiar cantidades.
                </>
              }
            />
            <StepItem
              num={3}
              text={
                <>
                  ¿Algún cliente quiere algo especial? Toca <strong className="text-white">"Notas"</strong> en cada plato
                  (ej. "sin cebolla", "término medio", "para llevar").
                </>
              }
            />
            <StepItem
              num={4}
              text={
                <>
                  Cuando el pedido esté listo, revisa el total en el carrito y toca{' '}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#9d4edd] text-white text-xs font-semibold">
                    <Send className="w-3 h-3" />
                    Enviar comanda
                  </span>
                </>
              }
            />
          </ol>
          <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-xl p-3 text-xs text-white/70">
            💡 <strong className="text-[#ff6b35]">Tip:</strong> Si el cliente cambia de opinión, puedes editar
            la comanda antes de enviarla. Después de enviada, cocina la recibe al instante.
          </div>
        </div>
      ),
    },
    // Paso 3: Seguir comandas
    {
      id: 'track-orders',
      emoji: '📋',
      title: 'Seguir tus comandas',
      subtitle: 'Estado en tiempo real desde cocina',
      icon: ClipboardList,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">
            En la pestaña <strong className="text-white">"Comandas"</strong> verás todas tus comandas activas
            con su estado actualizado:
          </p>
          <div className="space-y-2">
            <StatusBadge color="amber" label="Pendiente" desc="Cocina aún no empezó a preparar" />
            <StatusBadge color="blue" label="En preparación" desc="Cocina está trabajando en el pedido" />
            <StatusBadge color="emerald" label="Lista para servir" desc="¡Llévala a la mesa!" />
            <StatusBadge color="white/40" label="Entregada" desc="Comanda cerrada" />
          </div>
          <div className="bg-[#06d6a0]/10 border border-[#06d6a0]/20 rounded-xl p-3 text-xs text-white/70">
            🔔 Cocina cambia los estados automáticamente. La página se refresca cada 20 segundos —
            no necesitas recargar manualmente.
          </div>
        </div>
      ),
    },
    // Paso 4: Instalar app
    {
      id: 'install-app',
      emoji: '📱',
      title: 'Instala la app en tu celular',
      subtitle: 'Acceso rápido desde tu pantalla de inicio',
      icon: Smartphone,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">
            Para no volver a escribir el enlace, <strong className="text-white">instala el panel como una app</strong>:
          </p>
          <ol className="space-y-2.5 text-sm">
            <StepItem
              num={1}
              text={
                <>
                  Busca el banner <strong className="text-[#d4af37]">"Instala tu panel de mozo"</strong> arriba
                  (aparece solo si aún no está instalada).
                </>
              }
            />
            <StepItem
              num={2}
              text={
                <>
                  Toca <strong className="text-white">"Instalar app"</strong>. En Chrome/Android aparecerá
                  un diálogo — confirma. En iPhone, sigue las instrucciones (Compartir → Añadir a pantalla de inicio).
                </>
              }
            />
            <StepItem
              num={3}
              text={
                <>
                  ¡Listo! Tendrás un ícono en tu pantalla de inicio. Ábrela y verás que{' '}
                  <strong className="text-white">funciona sin barra del navegador</strong>, como una app real.
                </>
              }
            />
          </ol>
          <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-xl p-3 text-xs text-white/70">
            ✅ Si ya instalaste la app, el banner desaparece solo. Si la desinstalas, vuelve a aparecer.
          </div>
        </div>
      ),
    },
    // Paso 5: Offline (solo si plan lo permite)
    ...(hasOffline ? [{
      id: 'offline',
      emoji: '📶',
      title: 'Trabaja sin internet',
      subtitle: hasBackgroundSync ? 'Con auto-sync (Plan Full)' : 'Con sync manual (Plan Premium)',
      icon: WifiOff,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">
            ¿Se fue la señal del restaurante? <strong className="text-white">No hay problema.</strong> Puedes seguir
            tomando comandas — se guardan en tu celular.
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <WifiOff className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs text-white/70">
                <strong className="text-white">Cuando no hay internet:</strong> un banner amarillo aparece arriba.
                Las comandas que envías quedan en cola.
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CloudUpload className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs text-white/70">
                {hasBackgroundSync ? (
                  <><strong className="text-white">Cuando vuelve internet (Full):</strong> las comandas se envían
                    automáticamente, sin que hagas nada.</>
                ) : (
                  <><strong className="text-white">Cuando vuelve internet:</strong> toca{' '}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500 text-black text-[10px] font-semibold">
                      Enviar ahora
                    </span>{' '}
                    para sincronizar manualmente.</>
                )}
              </div>
            </div>
          </div>
          {!hasBackgroundSync && (
            <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-xl p-3 text-xs text-white/70">
              ⚡ <strong className="text-[#d4af37]">Mejora a Full</strong> para que las comandas offline se envíen solas
              al volver la conexión — sin intervención del mozo.
            </div>
          )}
        </div>
      ),
    }] : []),
    // Paso final
    {
      id: 'done',
      emoji: '🎉',
      title: '¡Listo!',
      subtitle: 'Ya sabes usar tu panel',
      icon: Check,
      content: (
        <div className="space-y-3 text-center py-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#9d4edd] to-[#d4af37] flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-white/80">
            Ya puedes empezar a tomar comandas. Si tienes dudas, vuelve a abrir este tutorial
            con el botón <strong className="text-white">"Guía"</strong> en la parte superior.
          </p>
          <div className="bg-[#9d4edd]/10 border border-[#9d4edd]/20 rounded-xl p-3 text-xs text-white/70">
            💡 <strong className="text-[#c77dff]">Recordatorio:</strong> instala la app para acceso rápido
            desde tu pantalla de inicio.
          </div>
        </div>
      ),
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const progress = ((step + 1) / steps.length) * 100;

  const handleClose = () => {
    setStep(0); // reset para próxima vez
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) setStep(step - 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0a0a14] border border-white/10 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col"
          >
            {/* Progress bar */}
            <div className="h-1 bg-white/5 rounded-t-3xl overflow-hidden flex-shrink-0">
              <motion.div
                className="h-full bg-gradient-to-r from-[#9d4edd] to-[#d4af37]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9d4edd] to-[#d4af37] flex items-center justify-center text-lg flex-shrink-0">
                  {currentStep.emoji}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                    Paso {step + 1} de {steps.length}
                  </div>
                  <div className="text-sm font-bold text-white truncate">{currentStep.title}</div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white flex-shrink-0"
                aria-label="Cerrar tutorial"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="px-4 sm:px-5 pt-3 text-xs text-white/50 flex-shrink-0">
              {currentStep.subtitle}
            </div>

            {/* Content (scrollable) */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
              {currentStep.content}
            </div>

            {/* Footer: botones */}
            <div className="p-4 sm:p-5 border-t border-white/5 flex items-center gap-2 flex-shrink-0">
              {!isFirst && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Atrás</span>
                </button>
              )}

              {/* Dots indicator */}
              <div className="flex-1 flex items-center justify-center gap-1.5">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step
                        ? 'w-6 bg-gradient-to-r from-[#9d4edd] to-[#d4af37]'
                        : i < step
                        ? 'w-1.5 bg-[#9d4edd]/50'
                        : 'w-1.5 bg-white/20'
                    }`}
                    aria-label={`Ir al paso ${i + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#9d4edd] to-[#d4af37] text-white font-semibold text-sm flex items-center gap-1.5 hover:opacity-90 transition shadow-lg"
              >
                {isLast ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Empezar</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Sub-componentes
function StepItem({ num, text }: { num: number; text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#9d4edd]/20 text-[#c77dff] text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </div>
      <div className="flex-1 text-white/80 leading-relaxed text-sm">{text}</div>
    </li>
  );
}

function StatusBadge({ color, label, desc }: { color: 'amber' | 'blue' | 'emerald' | 'white/40'; label: string; desc: string }) {
  const colorMap = {
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'white/40': 'bg-white/10 text-white/60 border-white/20',
  };
  return (
    <div className="flex items-center gap-3">
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${colorMap[color]}`}>
        {label}
      </span>
      <span className="text-xs text-white/60">{desc}</span>
    </div>
  );
}

/**
 * Botón "Guía" persistente para abrir el tutorial.
 * Se coloca en el header del panel del mozo.
 */
export function MozoTutorialButton({
  waiterName,
  planId,
  size = 'md',
}: {
  waiterName?: string;
  planId?: PlanId;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-2 rounded-lg text-xs'
    : 'px-3 py-2 rounded-xl text-sm';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${sizeClasses} inline-flex items-center gap-1.5 bg-[#9d4edd]/15 hover:bg-[#9d4edd]/25 text-[#c77dff] font-semibold border border-[#9d4edd]/30 transition flex-shrink-0`}
        aria-label="Abrir guía del mozo"
        title="Guía del mozo"
      >
        <BookOpen className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span className="hidden sm:inline">Guía</span>
      </button>
      <MozoTutorial
        open={open}
        onClose={() => setOpen(false)}
        waiterName={waiterName}
        planId={planId}
      />
    </>
  );
}
