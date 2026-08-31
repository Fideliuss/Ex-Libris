// Barre empilée générique : `segments` est une liste de
// { key, label, value, colorClass } (colorClass fixe le fond, ex: "bg-library").
export default function StatusStackedBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  return (
    <div>
      <div className="flex h-3 w-full rounded-full overflow-hidden bg-ink/5">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div
                key={s.key}
                className={s.colorClass}
                style={{ width: `${(s.value / total) * 100}%` }}
              />
            ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {segments.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs">
            <span
              aria-hidden="true"
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.colorClass}`}
            />
            <span className="text-ink/70">{s.label}</span>
            <span className="font-mono text-ink/70">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
