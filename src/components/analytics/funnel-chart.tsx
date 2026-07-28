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
}

export function FunnelChart({ stages, loading, conversionGlobal, deltaVisitas }: Props) {
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
            <h3 className="text-sm sm:text-base font-semibold">Embudo de conversión</h3>
            <p className="text-[10px] sm:text-xs text-white/50">
              {stages.length} etapas · conversión global{' '}
              <span className="text-[#d4af37] font-semibold">{conversionGlobal?.toFixed(1) || '0'}%</span>
            </p>
          </div>
        </div>
        {deltaVisitas !== undefined && (
          <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${deltaVisitas >= 0 ? 'text-[#06d6a0]' : 'text-[#e63946]'}`}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {deltaVisitas >= 0
                ? <path d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
                : <path d="M3 7l6 6 4-4 8 8M21 17v-6h-6" />}
            </svg>
            {Math.abs(deltaVisitas)}% vs período anterior
          </div>
        )}
      </div>

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
