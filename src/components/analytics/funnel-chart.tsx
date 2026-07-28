'use client';

/**
 * FunnelChart — gráfico de embudo horizontal responsive y mobile-first.
 *
 * Cada etapa se renderiza como una barra horizontal centrada que se va
 * estrechando según el % de conversión acumulado. El ancho máximo es 100%
 * del contenedor para NUNCA salirse del viewport móvil.
 */

interface FunnelStage {
  label: string;
  value: number;
  color: string;
  pct?: number;
}

interface Props {
  stages: FunnelStage[];
  loading?: boolean;
  conversionGlobal?: number;
  deltaVisitas?: number;
  /** Clics WhatsApp reales desglosados por source (cart = botón Enviar Pedido, social = ícono header) */
  clicksBySource?: { cart: number; social: number; direct: number };
  /** Delta % vs período anterior en clics WhatsApp */
  deltaWhatsappClicks?: number;
}

export function FunnelChart({ stages, loading, conversionGlobal, deltaVisitas, clicksBySource, deltaWhatsappClicks }: Props) {
  if (loading) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
        <p className="text-center text-white/50 text-sm py-8">Sin datos de embudo para este período</p>
      </div>
    );
  }

  const maxValue = Math.max(...stages.map(s => s.value), 1);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-6">
      <div className="flex items-start sm:items-center justify-between mb-4 sm:mb-6 flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 4h18l-7 9v7l-4 2v-9z" />
          </svg>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-semibold">Embudo de conversión</h3>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
                TRACKING REAL
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-white/50">
              {stages.length} etapas · conversión global{' '}
              <span className="text-[#d4af37] font-semibold">{conversionGlobal?.toFixed(1) || '0'}%</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {deltaWhatsappClicks !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${deltaWhatsappClicks >= 0 ? 'text-[#06d6a0]' : 'text-[#e63946]'}`} title="Clics WhatsApp vs período anterior">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/></svg>
              <span className="font-semibold">{deltaWhatsappClicks >= 0 ? '+' : ''}{deltaWhatsappClicks}%</span>
              <span className="text-white/40">WA</span>
            </div>
          )}
          {deltaVisitas !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${deltaVisitas >= 0 ? 'text-[#06d6a0]' : 'text-[#e63946]'}`}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {deltaVisitas >= 0
                  ? <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
                  : <path d="M3 7l6 6 4-4 8 8M21 17v-6h-6" />}
              </svg>
              {Math.abs(deltaVisitas)}% vs período anterior
            </div>
          )}
        </div>
      </div>

      {/* Desglose de clics WhatsApp por source (si hay datos reales) */}
      {clicksBySource && (clicksBySource.cart + clicksBySource.social + clicksBySource.direct) > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-[#25D366]/8 border border-[#25D366]/20">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
            <span className="text-[11px] sm:text-xs font-semibold text-[#25D366]">Clics WhatsApp reales por origen</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-base sm:text-lg font-bold text-white">{clicksBySource.cart}</div>
              <div className="text-[9px] sm:text-[10px] text-white/50">Botón Enviar Pedido</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white">{clicksBySource.social}</div>
              <div className="text-[9px] sm:text-[10px] text-white/50">Ícono social header</div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-white">{clicksBySource.direct}</div>
              <div className="text-[9px] sm:text-[10px] text-white/50">Otros</div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 sm:space-y-3">
        {stages.map((stage, i) => {
          const widthPct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="text-white/70 truncate flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: stage.color }}
                  />
                  <span className="truncate">{stage.label}</span>
                </span>
                <span className="font-bold text-white flex-shrink-0">
                  {stage.value.toLocaleString('es-PE')}
                </span>
              </div>
              <div className="relative h-7 sm:h-9 bg-white/5 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-lg transition-all duration-500 flex items-center justify-center"
                  style={{
                    width: `${Math.max(8, widthPct)}%`,
                    background: `linear-gradient(135deg, ${stage.color}, ${stage.color}80)`,
                    boxShadow: `0 0 12px ${stage.color}40`,
                  }}
                >
                  {stage.pct !== undefined && i > 0 && (
                    <span className="text-[10px] sm:text-xs font-bold text-white/95 px-1">
                      {stage.pct}%
                    </span>
                  )}
                </div>
              </div>
              {i > 0 && stage.pct !== undefined && (
                <div className="text-[10px] text-white/40 text-right">
                  {stage.pct}% de la etapa anterior
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed">
          💡 <span className="text-white/70">Insight:</span> {getInsight(stages, conversionGlobal)}
        </p>
      </div>
    </div>
  );
}

function getInsight(stages: FunnelStage[], conversionGlobal?: number): string {
  if (!stages || stages.length < 2) return 'Publica tu menú y comparte el QR para empezar a recibir visitas.';
  const first = stages[0];
  const last = stages[stages.length - 1];
  if (first.value === 0) return 'Aún no hay visitas. Comparte tu QR en redes sociales y muestra el link en tu local.';
  if (last.value === 0) return `Tienes ${first.value} visitas pero ninguna conversión final. Revisa que tu WhatsApp funcione y ten platos destacados.`;

  let maxDropIdx = -1;
  let maxDropPct = 0;
  for (let i = 1; i < stages.length; i++) {
    const prev = stages[i - 1].value;
    const cur = stages[i].value;
    if (prev > 0) {
      const drop = (prev - cur) / prev;
      if (drop > maxDropPct) {
        maxDropPct = drop;
        maxDropIdx = i;
      }
    }
  }
  if (maxDropIdx > 0 && maxDropPct > 0.5) {
    return `Mayor caída: "${stages[maxDropIdx - 1].label}" → "${stages[maxDropIdx].label}" (${Math.round(maxDropPct * 100)}% de pérdida). Optimiza esta etapa.`;
  }
  if ((conversionGlobal || 0) > 15) return `Excelente conversión global (${conversionGlobal?.toFixed(1)}%). Estás por encima del promedio de la industria (5-10%).`;
  if ((conversionGlobal || 0) > 5) return `Conversión saludable (${conversionGlobal?.toFixed(1)}%). Sigue optimizando el menú para crecer.`;
  return `Conversión baja (${conversionGlobal?.toFixed(1)}%). Prueba: fotos de mejor calidad, platos destacados, precios más visibles.`;
}
