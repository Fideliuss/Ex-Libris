// Donut SVG générique : `segments` est une liste de
// { key, label, value, colorClass }. `colorClass` doit fixer `color` (ex:
// "text-library") puisque le tracé utilise stroke="currentColor".
export default function DonutChart({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  if (total <= 0) return null

  const radius = 60
  const strokeWidth = 22
  const circumference = 2 * Math.PI * radius

  const arcs = []
  let cumulative = 0
  for (const s of segments) {
    if (s.value <= 0) continue
    arcs.push({ ...s, offset: -(cumulative / total) * circumference })
    cumulative += s.value
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 150 150" className="w-32 h-32 -rotate-90 shrink-0">
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-ink/5"
          strokeWidth={strokeWidth}
        />
        {arcs.map((s) => {
          const dash = (s.value / total) * circumference
          return (
            <circle
              key={s.key}
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="currentColor"
              className={s.colorClass}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={s.offset}
            />
          )
        })}
      </svg>
      <ul className="space-y-1.5 min-w-0">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={`w-3 h-3 rounded-full shrink-0 bg-current ${s.colorClass}`}
            />
            <span className="text-ink/70">{s.label}</span>
            <span className="font-mono text-xs text-ink/50 ml-auto pl-2">
              {s.value} · {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
