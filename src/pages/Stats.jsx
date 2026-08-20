import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBooks } from '../lib/books'
import MonthlyFinishedChart from '../components/MonthlyFinishedChart'

export default function Stats() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    listBooks()
      .then((data) => {
        if (active) setBooks(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const readCount = books.filter((b) => b.status === 'read').length
  const readingCount = books.filter((b) => b.status === 'reading').length
  const toReadCount = books.filter((b) => b.status === 'to-read').length
  const wishlistCount = books.filter((b) => b.status === 'wishlist').length
  const totalCount = readCount + readingCount + toReadCount
  const totalSpent = books
    .filter((b) => b.status !== 'wishlist')
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0)

  const tagStats = useMemo(() => {
    const map = new Map()
    for (const book of books) {
      for (const tag of book.tags ?? []) {
        const entry = map.get(tag) ?? { tag, count: 0, ratingSum: 0, ratingCount: 0 }
        entry.count += 1
        if (book.rating) {
          entry.ratingSum += book.rating
          entry.ratingCount += 1
        }
        map.set(tag, entry)
      }
    }
    return [...map.values()]
      .map((e) => ({
        ...e,
        avgRating: e.ratingCount ? e.ratingSum / e.ratingCount : null,
      }))
      .sort((a, b) => b.count - a.count)
  }, [books])

  const publisherStats = useMemo(() => {
    const map = new Map()
    for (const book of books) {
      if (!book.publisher) continue
      map.set(book.publisher, (map.get(book.publisher) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([publisher, count]) => ({ publisher, count }))
      .sort((a, b) => b.count - a.count)
  }, [books])

  const seriesStats = useMemo(() => {
    const map = new Map()
    for (const book of books) {
      if (!book.series) continue
      map.set(book.series, (map.get(book.series) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([series, count]) => ({ series, count }))
      .sort((a, b) => b.count - a.count)
  }, [books])

  const monthlyFinished = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
        shortLabel: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d),
        fullLabel: new Intl.DateTimeFormat('fr-FR', {
          month: 'long',
          year: 'numeric',
        }).format(d),
      })
    }
    const byKey = new Map(months.map((m) => [m.key, m]))
    for (const book of books) {
      if (!book.date_finished) continue
      const [y, m] = book.date_finished.split('-').map(Number)
      const bucket = byKey.get(`${y}-${m - 1}`)
      if (bucket) bucket.count += 1
    }
    return months
  }, [books])

  const maxTagCount = tagStats[0]?.count ?? 0
  const maxPublisherCount = publisherStats[0]?.count ?? 0
  const maxSeriesCount = seriesStats[0]?.count ?? 0

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </Link>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">
          Statistiques
        </h1>

        {loading ? (
          <p className="font-mono text-sm text-ink/60 text-center py-16">
            Chargement…
          </p>
        ) : error ? (
          <p role="alert" className="text-sm text-stamp text-center py-16">
            Erreur : {error}
          </p>
        ) : books.length === 0 ? (
          <p className="text-sm text-ink/60 text-center py-16">
            Ajoute des livres à ta collection pour voir apparaître tes
            statistiques.
          </p>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile label="Total" value={totalCount} />
              <StatTile label="Lus" value={readCount} accent="text-stamp" />
              <StatTile label="En cours" value={readingCount} />
              <StatTile label="À lire" value={toReadCount} />
              <StatTile label="Souhaités" value={wishlistCount} accent="text-brass" />
              <StatTile
                label="Dépensé"
                value={`${totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
              />
            </div>

            <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
              <h2 className="font-serif text-lg mb-4">
                Livres finis par mois
              </h2>
              <MonthlyFinishedChart months={monthlyFinished} />
            </section>

            <div className="grid sm:grid-cols-3 gap-6">
              <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                <h2 className="font-serif text-lg mb-4">Par tag</h2>
                {tagStats.length === 0 ? (
                  <p className="text-sm text-ink/50">Aucun tag pour l'instant.</p>
                ) : (
                  <ul className="space-y-3">
                    {tagStats.map((entry) => (
                      <li key={entry.tag}>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="text-sm truncate">{entry.tag}</span>
                          <span className="font-mono text-xs text-ink/60 shrink-0">
                            {entry.count}
                            {entry.avgRating != null &&
                              ` · ★ ${entry.avgRating.toFixed(1)}`}
                          </span>
                        </div>
                        <CountBar count={entry.count} max={maxTagCount} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                <h2 className="font-serif text-lg mb-4">Par éditeur</h2>
                {publisherStats.length === 0 ? (
                  <p className="text-sm text-ink/50">
                    Aucun éditeur renseigné pour l'instant.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {publisherStats.map((entry) => (
                      <li key={entry.publisher}>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="text-sm truncate">
                            {entry.publisher}
                          </span>
                          <span className="font-mono text-xs text-ink/60 shrink-0">
                            {entry.count}
                          </span>
                        </div>
                        <CountBar count={entry.count} max={maxPublisherCount} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                <h2 className="font-serif text-lg mb-4">Par série</h2>
                {seriesStats.length === 0 ? (
                  <p className="text-sm text-ink/50">
                    Aucune série renseignée pour l'instant.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {seriesStats.map((entry) => (
                      <li key={entry.series}>
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="text-sm truncate">
                            {entry.series}
                          </span>
                          <span className="font-mono text-xs text-ink/60 shrink-0">
                            {entry.count}
                          </span>
                        </div>
                        <CountBar count={entry.count} max={maxSeriesCount} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatTile({ label, value, accent }) {
  return (
    <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-4 text-center">
      <p className={`font-mono text-2xl font-semibold ${accent ?? 'text-ink'}`}>
        {value}
      </p>
      <p className="text-xs text-ink/60 mt-1">{label}</p>
    </div>
  )
}

function CountBar({ count, max }) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
  return (
    <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-library rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
