import { useState } from 'react'

function niceMax(value) {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const residual = value / magnitude
  let niceResidual
  if (residual <= 1) niceResidual = 1
  else if (residual <= 2) niceResidual = 2
  else if (residual <= 5) niceResidual = 5
  else niceResidual = 10
  return niceResidual * magnitude
}

// Graphique en barres générique : `bars` est une liste de
// { key, count, shortLabel, fullLabel }. Réutilisé pour les livres finis
// par mois et pour la distribution des notes.
export default function BarChart({ bars }) {
  const [hovered, setHovered] = useState(null)

  const max = Math.max(0, ...bars.map((m) => m.count))
  const chartMax = niceMax(max)
  const midTick = Math.round(chartMax / 2)

  return (
    <div>
      <div className="relative pl-8">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[chartMax, midTick, 0].map((tick, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-ink/40 w-6 -ml-8 text-right shrink-0">
                {tick}
              </span>
              <div className="flex-1 border-t border-ink/10" />
            </div>
          ))}
        </div>

        <div className="relative flex items-end gap-0.5 h-40">
          {bars.map((m, i) => {
            const heightPct = (m.count / chartMax) * 100
            return (
              <div
                key={m.key}
                className="flex-1 flex flex-col items-center justify-end h-full relative"
              >
                {hovered === i && (
                  <div
                    role="status"
                    className="absolute -top-8 bg-ink text-white text-xs font-mono px-2 py-1 rounded-sm whitespace-nowrap z-10"
                  >
                    {m.count} · {m.fullLabel}
                  </div>
                )}
                <button
                  type="button"
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(i)}
                  onBlur={() => setHovered(null)}
                  aria-label={`${m.fullLabel} : ${m.count}`}
                  className="w-full max-w-[24px] bg-library rounded-t-[4px] hover:bg-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library transition-colors"
                  style={{ height: `${m.count > 0 ? Math.max(heightPct, 4) : 0}%` }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-0.5 mt-1.5 pl-8">
        {bars.map((m) => (
          <div key={m.key} className="flex-1 text-center">
            <span className="font-mono text-[10px] text-ink/50">
              {m.shortLabel}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
