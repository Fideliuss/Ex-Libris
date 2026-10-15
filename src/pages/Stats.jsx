import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import {
  convertTagToCollection,
  renameCollection,
  renamePublisher,
  renameSeries,
} from '../lib/books'
import { useReadingGoals } from '../hooks/useReadingGoals'
import { bookPoints, TYPE_POINTS } from '../lib/points'
import { describeError } from '../lib/errors'
import { useGoBack } from '../lib/navigation'
import { formatDate, parseDateOnly } from '../lib/dates'
import { BOOK_TYPES } from '../lib/bookTypes'
import { STATUS_LABELS } from '../lib/statusLabels'
import { labelClass, linkButtonClass, backLinkClass, cardClass } from '../lib/ui'
import HouseholdSwitchBadge from '../components/HouseholdSwitchBadge'
import TabBar from '../components/TabBar'
import StatusStackedBar from '../components/StatusStackedBar'
import BarChart from '../components/BarChart'
import DonutChart from '../components/DonutChart'
import ReadingHeatmap from '../components/ReadingHeatmap'
import LoadingScreen from '../components/LoadingScreen'
import StatTile from '../components/stats/StatTile'
import CountBar from '../components/stats/CountBar'
import PaginatedList from '../components/stats/PaginatedList'
import RenameableStatRow from '../components/stats/RenameableStatRow'
import ObjectiveCard from '../components/stats/ObjectiveCard'
import GoalHistorySection from '../components/stats/GoalHistorySection'

const PERIOD_OPTIONS = {
  all: 'Tout',
  year: 'Cette année',
  rolling12: '12 derniers mois',
  custom: 'Personnalisé',
}

const STATS_TABS = [
  { key: 'overview', label: "Vue d'ensemble" },
  { key: 'activity', label: 'Activité de lecture' },
  { key: 'library', label: 'Bibliothèque' },
]

// Nombre de livres par valeur d'un champ, du plus fréquent au moins fréquent
// (les livres sans valeur sont ignorés).
function countBy(books, field, key) {
  const counts = new Map()
  for (const book of books) {
    const value = book[field]
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ [key]: name, count }))
    .sort((a, b) => b.count - a.count)
}

export default function Stats() {
  const { user } = useAuth()
  const { members, ownerId, isMine, books, loading, error, refresh, setOwnerId } =
    useHouseholdBooks()
  const viewedUserId = ownerId
  const readingGoals = useReadingGoals(viewedUserId)
  const selectedMember = members.find((m) => m.userId === ownerId)
  const selectedLabel = selectedMember?.displayName ?? selectedMember?.email
  const goBack = useGoBack('/')
  const [convertingTag, setConvertingTag] = useState(null)
  const [convertError, setConvertError] = useState(null)
  const [statsTab, setStatsTab] = useState('overview')
  const [period, setPeriod] = useState('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  async function handleConvertTag(tag) {
    setConvertingTag(tag)
    setConvertError(null)
    try {
      await convertTagToCollection(tag)
      await refresh()
    } catch (err) {
      setConvertError(describeError(err))
    } finally {
      setConvertingTag(null)
    }
  }

  const { readCount, readingCount, toReadCount, wishlistCount, totalSpent } = useMemo(() => {
    const counts = { read: 0, reading: 0, 'to-read': 0, wishlist: 0 }
    let spent = 0
    for (const b of books) {
      counts[b.status] = (counts[b.status] ?? 0) + 1
      if (b.status !== 'wishlist') spent += Number(b.price) || 0
    }
    return {
      readCount: counts.read,
      readingCount: counts.reading,
      toReadCount: counts['to-read'],
      wishlistCount: counts.wishlist,
      totalSpent: spent,
    }
  }, [books])
  const totalCount = readCount + readingCount + toReadCount

  const statusSegments = [
    { key: 'read', label: STATUS_LABELS.read, value: readCount, colorClass: 'bg-library' },
    {
      key: 'reading',
      label: STATUS_LABELS.reading,
      value: readingCount,
      colorClass: 'bg-reading',
    },
    {
      key: 'to-read',
      label: STATUS_LABELS['to-read'],
      value: toReadCount,
      colorClass: 'bg-brass',
    },
  ]

  const currentYearScore = useMemo(() => {
    const year = String(new Date().getFullYear())
    return books
      .filter((b) => b.date_finished?.startsWith(year))
      .reduce((sum, b) => sum + bookPoints(b), 0)
  }, [books])

  const currentYearBreakdown = useMemo(() => {
    const year = String(new Date().getFullYear())
    const counts = { book: 0, bd: 0, comics: 0, manga: 0 }
    for (const b of books) {
      if (!b.date_finished?.startsWith(year)) continue
      counts[b.type ?? 'book'] += 1
    }
    return Object.entries(BOOK_TYPES)
      .map(([key, label]) => ({
        key,
        label,
        count: counts[key],
        points: counts[key] * TYPE_POINTS[key],
      }))
      .filter((entry) => entry.count > 0)
  }, [books])

  const lastFinishedByType = useMemo(() => {
    // Un seul parcours : le dernier livre fini (date la plus récente) par type.
    const latest = {}
    for (const b of books) {
      if (!b.date_finished) continue
      const type = b.type ?? 'book'
      if (!latest[type] || b.date_finished > latest[type].date_finished) latest[type] = b
    }
    return Object.entries(BOOK_TYPES)
      .filter(([type]) => latest[type])
      .map(([type, label]) => ({ type, label, book: latest[type] }))
  }, [books])

  const typeSegments = useMemo(() => {
    const colorByType = {
      book: 'text-library',
      bd: 'text-brass',
      comics: 'text-wishlist',
      manga: 'text-reading',
    }
    const counts = { book: 0, bd: 0, comics: 0, manga: 0 }
    for (const b of books) counts[b.type ?? 'book'] += 1
    return Object.entries(BOOK_TYPES).map(([key, label]) => ({
      key,
      label,
      value: counts[key],
      colorClass: colorByType[key],
    }))
  }, [books])

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

  const publisherStats = useMemo(() => countBy(books, 'publisher', 'publisher'), [books])

  const collectionStats = useMemo(() => countBy(books, 'collection', 'collection'), [books])

  const seriesStats = useMemo(() => countBy(books, 'series', 'series'), [books])

  // Bornes de la période sélectionnée : pilote tout l'onglet "Activité de
  // lecture" (rythme, notes, couvertures, calendrier, livres finis par mois).
  const periodRange = useMemo(() => {
    const now = new Date()
    if (period === 'year') {
      return { start: new Date(now.getFullYear(), 0, 1), end: now }
    }
    if (period === 'rolling12') {
      return { start: new Date(now.getFullYear(), now.getMonth() - 11, 1), end: now }
    }
    if (period === 'custom') {
      return {
        start: customFrom ? parseDateOnly(customFrom) : null,
        end: customTo ? parseDateOnly(customTo) : now,
      }
    }
    return { start: null, end: now }
  }, [period, customFrom, customTo])

  const finishedInPeriod = useMemo(() => {
    return books.filter((b) => {
      if (!b.date_finished) return false
      const d = parseDateOnly(b.date_finished)
      if (periodRange.start && d < periodRange.start) return false
      return d <= periodRange.end
    })
  }, [books, periodRange])

  // Un mois par barre, sur la période sélectionnée, plafonné à 12 barres
  // (les 12 derniers mois de la période) pour rester lisible même avec
  // "Tout" sélectionné sur plusieurs années.
  const monthlyFinished = useMemo(() => {
    const end = periodRange.end
    const cappedStart = new Date(end.getFullYear(), end.getMonth() - 11, 1)
    const start =
      periodRange.start && periodRange.start > cappedStart
        ? new Date(periodRange.start.getFullYear(), periodRange.start.getMonth(), 1)
        : cappedStart

    const months = []
    const cursor = new Date(start)
    while (cursor <= end) {
      months.push({
        key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
        count: 0,
        shortLabel: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(
          cursor,
        ),
        fullLabel: new Intl.DateTimeFormat('fr-FR', {
          month: 'long',
          year: 'numeric',
        }).format(cursor),
      })
      cursor.setMonth(cursor.getMonth() + 1)
    }
    const byKey = new Map(months.map((m) => [m.key, m]))
    for (const book of finishedInPeriod) {
      const [y, m] = book.date_finished.split('-').map(Number)
      const bucket = byKey.get(`${y}-${m - 1}`)
      if (bucket) bucket.count += 1
    }
    return months
  }, [finishedInPeriod, periodRange])

  const paceStats = useMemo(() => {
    const pagesRead = finishedInPeriod.reduce(
      (sum, b) => sum + (b.page_count || 0),
      0,
    )

    // Un livre commencé et fini le même jour compte comme 1 jour de lecture,
    // pas 0 : ce plancher s'applique après avoir écarté les dates
    // incohérentes (fini avant d'être commencé), qui restent filtrées comme
    // avant plutôt que remontées à 1.
    const durations = finishedInPeriod
      .filter((b) => b.date_started && b.date_finished)
      .map((b) => ({
        book: b,
        days: Math.round(
          (parseDateOnly(b.date_finished) - parseDateOnly(b.date_started)) /
            86400000,
        ),
      }))
      .filter((d) => d.days >= 0)
      .map((d) => (d.days === 0 ? { ...d, days: 1 } : d))

    const avgDays = durations.length
      ? durations.reduce((sum, d) => sum + d.days, 0) / durations.length
      : null
    const fastest = durations.length
      ? durations.reduce((a, b) => (b.days < a.days ? b : a))
      : null
    const slowest = durations.length
      ? durations.reduce((a, b) => (b.days > a.days ? b : a))
      : null

    let spanStart = periodRange.start
    if (!spanStart && finishedInPeriod.length > 0) {
      const earliest = finishedInPeriod.reduce(
        (min, b) => (b.date_finished < min ? b.date_finished : min),
        finishedInPeriod[0].date_finished,
      )
      spanStart = parseDateOnly(earliest)
    }
    const monthsSpan = spanStart
      ? Math.max(
          1,
          (periodRange.end.getFullYear() - spanStart.getFullYear()) * 12 +
            (periodRange.end.getMonth() - spanStart.getMonth()) +
            1,
        )
      : 1
    const perMonth = finishedInPeriod.length / monthsSpan

    return { pagesRead, avgDays, fastest, slowest, perMonth }
  }, [finishedInPeriod, periodRange])

  // Un cran par demi-étoile (0, 0.5, 1, ..., 5) : l'index est le rang *2,
  // 11 crans au lieu de 6 pour les notes entières uniquement. Avec des
  // étoiles empilées ("★★★½"), les étiquettes de 11 barres se chevauchaient
  // (illisible) : un simple chiffre à la place, et seuls les paliers
  // entiers sont étiquetés (les demi-crans restent des barres nues) pour
  // aérer l'axe sans retirer de barres.
  const ratingBars = useMemo(() => {
    const counts = new Array(11).fill(0)
    for (const b of finishedInPeriod) counts[Math.round((b.rating || 0) * 2)] += 1
    return counts.map((count, i) => {
      const rating = i / 2
      const isWholeStep = rating % 1 === 0
      return {
        key: String(i),
        count,
        shortLabel: !isWholeStep ? '' : rating === 0 ? '—' : String(rating),
        fullLabel:
          rating === 0
            ? 'Non noté'
            : `${rating} étoile${rating > 1 ? 's' : ''}`,
      }
    })
  }, [finishedInPeriod])

  const avgRating = useMemo(() => {
    const rated = finishedInPeriod.filter((b) => b.rating > 0)
    if (!rated.length) return null
    return rated.reduce((sum, b) => sum + b.rating, 0) / rated.length
  }, [finishedInPeriod])

  const coverWallBooks = useMemo(() => {
    return finishedInPeriod
      .filter((b) => b.cover_url)
      .sort((a, b) => (b.date_finished ?? '').localeCompare(a.date_finished ?? ''))
  }, [finishedInPeriod])

  const maxTagCount = tagStats[0]?.count ?? 0
  const maxPublisherCount = publisherStats[0]?.count ?? 0
  const maxCollectionCount = collectionStats[0]?.count ?? 0
  const maxSeriesCount = seriesStats[0]?.count ?? 0

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className={backLinkClass}
        >
          ← Retour à la collection
        </button>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">
          Statistiques
        </h1>

        {members.length > 1 && (
          <div className="mb-6">
            <HouseholdSwitchBadge
              members={members}
              selectedId={ownerId}
              onSelect={setOwnerId}
              currentUserId={user.id}
            />
          </div>
        )}

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : error ? (
          <p role="alert" className="text-sm text-stamp text-center py-16">
            Erreur : {error}
          </p>
        ) : books.length === 0 ? (
          <p className="text-sm text-ink/70 text-center py-16">
            {isMine
              ? "Ajoute des livres à ta collection pour voir apparaître tes statistiques."
              : `${selectedLabel} n'a pas encore de livres.`}
          </p>
        ) : (
          <div className="space-y-6">
            <TabBar
              tabs={STATS_TABS}
              active={statsTab}
              onChange={setStatsTab}
              ariaLabel="Section de statistiques"
            />

            {statsTab === 'overview' && (
              <div className="space-y-6">
                <ObjectiveCard
                  isMine={isMine}
                  score={currentYearScore}
                  breakdown={currentYearBreakdown}
                  readingGoals={readingGoals}
                />

                <div className="grid sm:grid-cols-2 gap-6">
                  <section className={`${cardClass} p-6`}>
                    <h2 className="font-serif text-lg mb-1">
                      Statut de la collection
                    </h2>
                    <p className="text-sm text-ink/70 mb-3">
                      {totalCount} livre{totalCount > 1 ? 's' : ''} au total
                    </p>
                    <StatusStackedBar segments={statusSegments} />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <StatTile
                        label="Wishlist"
                        value={wishlistCount}
                        accent="text-brass"
                      />
                      <StatTile
                        label="Dépensé"
                        value={`${totalSpent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                      />
                    </div>
                  </section>

                  <section className={`${cardClass} p-6`}>
                    <h2 className="font-serif text-lg mb-4">
                      Répartition par type
                    </h2>
                    <DonutChart segments={typeSegments} />
                  </section>
                </div>

                {lastFinishedByType.length > 0 && (
                  <section className={`${cardClass} p-6`}>
                    <h2 className="font-serif text-lg mb-4">
                      Derniers livres terminés
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {lastFinishedByType.map(({ type, label, book }) => (
                        <Link
                          key={type}
                          to={`/books/${book.id}`}
                          className="flex gap-4 items-center hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                        >
                          <div className="w-14 aspect-[2/3] rounded-sm overflow-hidden border border-ink/10 bg-paper shrink-0">
                            {book.cover_url ? (
                              <img
                                src={book.cover_url}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="font-serif text-ink/70 text-xs px-1 text-center">
                                  {book.title}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-ink/70">
                              {label}
                            </p>
                            <p className="font-serif text-base truncate">
                              {book.title}
                            </p>
                            {book.author?.length > 0 && (
                              <p className="text-xs text-ink/70 truncate">
                                {book.author.join(', ')}
                              </p>
                            )}
                            <p className="text-xs text-ink/70 mt-0.5">
                              Terminé le {formatDate(book.date_finished)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {statsTab === 'activity' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-lg">Activité de lecture</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      aria-label="Période"
                      className="rounded-sm border border-ink/20 bg-surface px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                    >
                      {Object.entries(PERIOD_OPTIONS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {period === 'custom' && (
                      <>
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          aria-label="Du"
                          className="rounded-sm border border-ink/20 bg-surface px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                        />
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          aria-label="Au"
                          className="rounded-sm border border-ink/20 bg-surface px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                        />
                      </>
                    )}
                  </div>
                </div>

                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">Rythme &amp; notes</h2>

                  {finishedInPeriod.length === 0 ? (
                    <p className="text-sm text-ink/70">
                      Aucun livre fini sur cette période.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className={`${labelClass} mb-3`}>
                          Rythme de lecture
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          <StatTile
                            label="Livres finis"
                            value={finishedInPeriod.length}
                          />
                          <StatTile
                            label="Pages lues"
                            value={paceStats.pagesRead.toLocaleString('fr-FR')}
                          />
                          <StatTile
                            label="Par mois (moy.)"
                            value={paceStats.perMonth.toFixed(1)}
                          />
                          <StatTile
                            label="Jours / livre (moy.)"
                            value={
                              paceStats.avgDays != null
                                ? Math.round(paceStats.avgDays)
                                : '—'
                            }
                          />
                        </div>
                        {paceStats.fastest && (
                          <p className="text-xs text-ink/70 mt-3">
                            Lecture éclair :{' '}
                            <span className="text-ink/70">
                              {paceStats.fastest.book.title}
                            </span>{' '}
                            en {paceStats.fastest.days} jour
                            {paceStats.fastest.days > 1 ? 's' : ''}
                          </p>
                        )}
                        {paceStats.slowest &&
                          paceStats.slowest !== paceStats.fastest && (
                            <p className="text-xs text-ink/70 mt-1">
                              Lecture marathon :{' '}
                              <span className="text-ink/70">
                                {paceStats.slowest.book.title}
                              </span>{' '}
                              en {paceStats.slowest.days} jours
                            </p>
                          )}
                      </div>

                      <div>
                        <h3 className={`${labelClass} mb-3`}>
                          Notes
                          {avgRating != null &&
                            ` · moyenne ${avgRating.toFixed(1)} ★`}
                        </h3>
                        <BarChart bars={ratingBars} />
                      </div>
                    </div>
                  )}
                </section>

                {finishedInPeriod.length > 0 && (
                  <section className={`${cardClass} p-6`}>
                    <h2 className="font-serif text-lg mb-4">Couvertures</h2>
                    {coverWallBooks.length === 0 ? (
                      <p className="text-sm text-ink/70">
                        Aucune couverture pour les livres finis sur cette
                        période.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {coverWallBooks.map((book) => (
                            <Link
                              key={book.id}
                              to={`/books/${book.id}`}
                              title={book.title}
                              className="relative w-12 aspect-[2/3] rounded-sm overflow-hidden border border-ink/10 bg-paper shrink-0 transition-transform duration-150 hover:scale-150 hover:z-10 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-library focus-visible:scale-150 focus-visible:z-10"
                            >
                              {/* Mosaïque décorative et compacte : ici on veut
                                  que chaque case soit pleine, donc
                                  object-cover est volontaire (contrairement à
                                  l'affichage complet utilisé ailleurs pour les
                                  couvertures). */}
                              <img
                                src={book.cover_url}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ))}
                        </div>
                        {finishedInPeriod.length > coverWallBooks.length && (
                          <p className="text-xs text-ink/70 mt-3">
                            + {finishedInPeriod.length - coverWallBooks.length}{' '}
                            livre
                            {finishedInPeriod.length - coverWallBooks.length > 1
                              ? 's'
                              : ''}{' '}
                            sans couverture
                          </p>
                        )}
                      </>
                    )}
                  </section>
                )}

                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">
                    Calendrier de lecture
                  </h2>
                  <ReadingHeatmap books={finishedInPeriod} />
                </section>

                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">
                    Livres finis par mois
                  </h2>
                  <BarChart bars={monthlyFinished} />
                </section>

                <GoalHistorySection
                  isMine={isMine}
                  books={books}
                  readingGoals={readingGoals}
                />
              </div>
            )}

            {statsTab === 'library' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">Par tag</h2>
                  {isMine && (
                    <p className="text-xs text-ink/70 mb-3">
                      Un tag qui est en fait un nom de collection éditeur (ex:
                      "folio sf") ? Clique "→ Collection" pour le déplacer sur
                      tous les livres concernés.
                    </p>
                  )}
                  {convertError && (
                    <p role="alert" className="text-sm text-stamp mb-3">
                      {convertError}
                    </p>
                  )}
                  {tagStats.length === 0 ? (
                    <p className="text-sm text-ink/70">
                      Aucun tag pour l'instant.
                    </p>
                  ) : (
                    <PaginatedList items={tagStats}>
                      {(entry) => (
                        <li key={entry.tag}>
                          <div className="flex items-baseline justify-between gap-2 mb-1">
                            <span className="text-sm truncate">
                              {entry.tag}
                            </span>
                            <span className="font-mono text-xs text-ink/70 shrink-0">
                              {entry.count}
                              {entry.avgRating != null &&
                                ` · ★ ${entry.avgRating.toFixed(1)}`}
                            </span>
                          </div>
                          <CountBar
                            count={entry.count}
                            max={maxTagCount}
                            colorClass="bg-library"
                          />
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => handleConvertTag(entry.tag)}
                              disabled={convertingTag === entry.tag}
                              className={`mt-1 ${linkButtonClass} disabled:opacity-60`}
                            >
                              {convertingTag === entry.tag
                                ? 'Déplacement…'
                                : '→ Collection'}
                            </button>
                          )}
                        </li>
                      )}
                    </PaginatedList>
                  )}
                </section>

                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">Par éditeur</h2>
                  {publisherStats.length === 0 ? (
                    <p className="text-sm text-ink/70">
                      Aucun éditeur renseigné pour l'instant.
                    </p>
                  ) : (
                    <PaginatedList items={publisherStats}>
                      {(entry) => (
                        <RenameableStatRow
                          key={entry.publisher}
                          name={entry.publisher}
                          count={entry.count}
                          max={maxPublisherCount}
                          colorClass="bg-brass"
                          existingNames={publisherStats.map((e) => e.publisher)}
                          onRename={renamePublisher}
                          isMine={isMine}
                          onRenamed={refresh}
                        />
                      )}
                    </PaginatedList>
                  )}
                </section>

                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">Par collection</h2>
                  {collectionStats.length === 0 ? (
                    <p className="text-sm text-ink/70">
                      Aucune collection renseignée pour l'instant.
                    </p>
                  ) : (
                    <PaginatedList items={collectionStats}>
                      {(entry) => (
                        <RenameableStatRow
                          key={entry.collection}
                          name={entry.collection}
                          count={entry.count}
                          max={maxCollectionCount}
                          colorClass="bg-wishlist"
                          existingNames={collectionStats.map(
                            (e) => e.collection,
                          )}
                          onRename={renameCollection}
                          isMine={isMine}
                          onRenamed={refresh}
                        />
                      )}
                    </PaginatedList>
                  )}
                </section>

                <section className={`${cardClass} p-6`}>
                  <h2 className="font-serif text-lg mb-4">Par série</h2>
                  {seriesStats.length === 0 ? (
                    <p className="text-sm text-ink/70">
                      Aucune série renseignée pour l'instant.
                    </p>
                  ) : (
                    <PaginatedList items={seriesStats}>
                      {(entry) => (
                        <RenameableStatRow
                          key={entry.series}
                          name={entry.series}
                          count={entry.count}
                          max={maxSeriesCount}
                          colorClass="bg-reading"
                          existingNames={seriesStats.map((e) => e.series)}
                          onRename={renameSeries}
                          isMine={isMine}
                          onRenamed={refresh}
                        />
                      )}
                    </PaginatedList>
                  )}
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
