export default function CountBar({ count, max, colorClass = 'bg-library' }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
  return (
    <div className="h-2 w-full bg-ink/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
