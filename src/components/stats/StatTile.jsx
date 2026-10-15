import { cardClass } from '../../lib/ui'

export default function StatTile({ label, value, accent }) {
  return (
    <div className={`${cardClass} p-4 text-center`}>
      <p className={`font-mono text-2xl font-semibold ${accent ?? 'text-ink'}`}>
        {value}
      </p>
      <p className="text-xs text-ink/70 mt-1">{label}</p>
    </div>
  )
}
