import { useMemo, useState } from 'react'

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const MONTH_FMT = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeekMonday(date) {
  const day = (date.getDay() + 6) % 7
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function levelClass(count) {
  if (count <= 0) return 'bg-ink/5'
  if (count === 1) return 'bg-library/35'
  if (count === 2) return 'bg-library/65'
  return 'bg-library'
}

// Calendrier façon "contributions" : une case par jour sur les 52 dernières
// semaines, colorée selon le nombre de livres finis ce jour-là.
export default function ReadingHeatmap({ books }) {
  const [hovered, setHovered] = useState(null)

  const { weeks, monthLabels } = useMemo(() => {
    const counts = new Map()
    for (const b of books) {
      if (!b.date_finished) continue
      counts.set(b.date_finished, (counts.get(b.date_finished) ?? 0) + 1)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const gridStart = startOfWeekMonday(today)
    gridStart.setDate(gridStart.getDate() - 52 * 7)

    const weeks = []
    const monthLabels = []
    let lastMonth = null
    const cursor = new Date(gridStart)

    for (let w = 0; w < 53; w++) {
      const days = []
      for (let d = 0; d < 7; d++) {
        const key = toDateKey(cursor)
        days.push({
          key,
          date: new Date(cursor),
          count: cursor > today ? null : (counts.get(key) ?? 0),
        })
        cursor.setDate(cursor.getDate() + 1)
      }
      const month = days[0].date.getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ week: w, label: MONTH_FMT.format(days[0].date) })
        lastMonth = month
      }
      weeks.push(days)
    }

    return { weeks, monthLabels }
  }, [books])

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex flex-col">
        <div className="flex gap-[3px] mb-1 pl-6">
          {weeks.map((_, i) => {
            const label = monthLabels.find((m) => m.week === i)
            return (
              <span
                key={i}
                className="w-[11px] font-mono text-[9px] text-ink/40 shrink-0"
              >
                {label?.label ?? ''}
              </span>
            )
          })}
        </div>
        <div className="flex gap-[3px]">
          <div className="flex flex-col gap-[3px] pr-1 shrink-0">
            {DAY_LETTERS.map((letter, i) => (
              <span
                key={i}
                className="w-5 h-[11px] font-mono text-[9px] text-ink/40 leading-none flex items-center"
              >
                {i % 2 === 1 ? letter : ''}
              </span>
            ))}
          </div>
          {weeks.map((days, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {days.map((day) => (
                <div key={day.key} className="relative">
                  {hovered === day.key && day.count !== null && (
                    <div
                      role="status"
                      className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] font-mono px-2 py-1 rounded-sm whitespace-nowrap z-10"
                    >
                      {day.count} · {DATE_FMT.format(day.date)}
                    </div>
                  )}
                  <div
                    aria-label={
                      day.count === null
                        ? undefined
                        : `${DATE_FMT.format(day.date)} : ${day.count} livre${day.count > 1 ? 's' : ''} terminé${day.count > 1 ? 's' : ''}`
                    }
                    onMouseEnter={() =>
                      day.count !== null && setHovered(day.key)
                    }
                    onMouseLeave={() => setHovered(null)}
                    className={`w-[11px] h-[11px] rounded-[2px] ${
                      day.count === null ? 'invisible' : levelClass(day.count)
                    }`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
