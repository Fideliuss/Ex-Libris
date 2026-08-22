import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import {
  convertTagToCollection,
  renameCollection,
  renamePublisher,
  renameSeries,
} from '../lib/books'
import { getAnnualGoal, updateAnnualGoal } from '../lib/userSettings'
import { bookPoints } from '../lib/points'
import { describeError } from '../lib/errors'
import { useGoBack } from '../lib/navigation'
import { BOOK_TYPES } from '../lib/bookTypes'
import { STATUS_LABELS } from '../lib/statusLabels'
import HouseholdTabs from '../components/HouseholdTabs'
import TabBar from '../components/TabBar'
import StatusStackedBar from '../components/StatusStackedBar'
import BarChart from '../components/BarChart'
import DonutChart from '../components/DonutChart'
import ReadingHeatmap from '../components/ReadingHeatmap'
import LoadingScreen from '../components/LoadingScreen'

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

// Les champs date_started/date_finished sont des "date" Postgres (pas de
// composante horaire) : les parser avec `new Date(string)` les interprète en
// UTC et peut décaler d'un jour selon le fuseau du navigateur. On construit
// la date en local à partir des parties, comme formatDate() plus bas.
function parseDateOnly(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(value) {
  if (!value) return null
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

export default function Stats() {
  const { user } = useAuth()
  const { partner, isMine, books, loading, error, refresh, setView } =
    useHouseholdBooks()
  const viewedUserId = isMine ? user?.id : partner?.id
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

  const readCount = books.filter((b) => b.status === 'read').length
  const readingCount = books.filter((b) => b.status === 'reading').length
  const toReadCount = books.filter((b) => b.status === 'to-read').length
  const wishlistCount = books.filter((b) => b.status === 'wishlist').length
  const totalCount = readCount + readingCount + toReadCount
  const totalSpent = books
    .filter((b) => b.status !== 'wishlist')
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0)

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

  const lastFinished = useMemo(() => {
    return (
      books
        .filter((b) => b.date_finished)
        .sort((a, b) => b.date_finished.localeCompare(a.date_finished))[0] ??
      null
    )
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

  const collectionStats = useMemo(() => {
    const map = new Map()
    for (const book of books) {
      if (!book.collection) continue
      map.set(book.collection, (map.get(book.collection) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([collection, count]) => ({ collection, count }))
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

  // Bornes de la période sélectionnée, pour le rythme de lecture et les
  // notes uniquement (le reste de la page reste sur toute la collection).
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

  const paceStats = useMemo(() => {
    const pagesRead = finishedInPeriod.reduce(
      (sum, b) => sum + (b.page_count || 0),
      0,
    )

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

  const ratingBars = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0]
    for (const b of finishedInPeriod) counts[b.rating || 0] += 1
    return ['Non noté', '1 étoile', '2 étoiles', '3 étoiles', '4 étoiles', '5 étoiles'].map(
      (fullLabel, i) => ({
        key: String(i),
        count: counts[i],
        shortLabel: i === 0 ? '—' : '★'.repeat(i),
        fullLabel,
      }),
    )
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
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </button>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">
          Statistiques
        </h1>

        {partner && (
          <HouseholdTabs
            isMine={isMine}
            onSelectMine={() => setView('mine')}
            onSelectPartner={() => setView('partner')}
            mineLabel="Mes statistiques"
            partnerLabel={`Statistiques de ${partner.label}`}
            ariaLabel="Statistiques à afficher"
          />
        )}

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : error ? (
          <p role="alert" className="text-sm text-stamp text-center py-16">
            Erreur : {error}
          </p>
        ) : books.length === 0 ? (
          <p className="text-sm text-ink/60 text-center py-16">
            {isMine
              ? "Ajoute des livres à ta collection pour voir apparaître tes statistiques."
              : `${partner?.label} n'a pas encore de livres.`}
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
                  viewedUserId={viewedUserId}
                  isMine={isMine}
                  score={currentYearScore}
                />

                <div className="grid sm:grid-cols-2 gap-6">
                  <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                    <h2 className="font-serif text-lg mb-1">
                      Statut de la collection
                    </h2>
                    <p className="text-sm text-ink/50 mb-3">
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

                  <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                    <h2 className="font-serif text-lg mb-4">
                      Répartition par type
                    </h2>
                    <DonutChart segments={typeSegments} />
                  </section>
                </div>

                {lastFinished && (
                  <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                    <h2 className="font-serif text-lg mb-4">
                      Dernier livre terminé
                    </h2>
                    <Link
                      to={`/books/${lastFinished.id}`}
                      className="flex gap-4 items-center hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                    >
                      <div className="w-16 aspect-[2/3] rounded-sm overflow-hidden border border-ink/10 bg-paper shrink-0">
                        {lastFinished.cover_url ? (
                          <img
                            src={lastFinished.cover_url}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="font-serif text-ink/30 text-xs px-1 text-center">
                              {lastFinished.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-lg truncate">
                          {lastFinished.title}
                        </p>
                        {lastFinished.author && (
                          <p className="text-sm text-ink/60 truncate">
                            {lastFinished.author}
                          </p>
                        )}
                        <p className="text-xs text-ink/40 mt-1">
                          Terminé le {formatDate(lastFinished.date_finished)}
                        </p>
                      </div>
                    </Link>
                  </section>
                )}
              </div>
            )}

            {statsTab === 'activity' && (
              <div className="space-y-6">
                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h2 className="font-serif text-lg">Rythme &amp; notes</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        aria-label="Période"
                        className="rounded-sm border border-ink/20 bg-white px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
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
                            className="rounded-sm border border-ink/20 bg-white px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                          />
                          <input
                            type="date"
                            value={customTo}
                            onChange={(e) => setCustomTo(e.target.value)}
                            aria-label="Au"
                            className="rounded-sm border border-ink/20 bg-white px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {finishedInPeriod.length === 0 ? (
                    <p className="text-sm text-ink/50">
                      Aucun livre fini sur cette période.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-3">
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
                          <p className="text-xs text-ink/50 mt-3">
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
                            <p className="text-xs text-ink/50 mt-1">
                              Lecture marathon :{' '}
                              <span className="text-ink/70">
                                {paceStats.slowest.book.title}
                              </span>{' '}
                              en {paceStats.slowest.days} jours
                            </p>
                          )}
                      </div>

                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-3">
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
                  <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                    <h2 className="font-serif text-lg mb-4">Couvertures</h2>
                    {coverWallBooks.length === 0 ? (
                      <p className="text-sm text-ink/50">
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
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ))}
                        </div>
                        {finishedInPeriod.length > coverWallBooks.length && (
                          <p className="text-xs text-ink/40 mt-3">
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

                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <h2 className="font-serif text-lg mb-4">
                    Calendrier de lecture
                  </h2>
                  <ReadingHeatmap books={books} />
                </section>

                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <h2 className="font-serif text-lg mb-4">
                    Livres finis par mois
                  </h2>
                  <BarChart bars={monthlyFinished} />
                </section>
              </div>
            )}

            {statsTab === 'library' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <h2 className="font-serif text-lg mb-4">Par tag</h2>
                  {isMine && (
                    <p className="text-xs text-ink/50 mb-3">
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
                    <p className="text-sm text-ink/50">
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
                            <span className="font-mono text-xs text-ink/60 shrink-0">
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
                              className="mt-1 text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm disabled:opacity-60"
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

                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <h2 className="font-serif text-lg mb-4">Par éditeur</h2>
                  {publisherStats.length === 0 ? (
                    <p className="text-sm text-ink/50">
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

                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <h2 className="font-serif text-lg mb-4">Par collection</h2>
                  {collectionStats.length === 0 ? (
                    <p className="text-sm text-ink/50">
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

                <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                  <h2 className="font-serif text-lg mb-4">Par série</h2>
                  {seriesStats.length === 0 ? (
                    <p className="text-sm text-ink/50">
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

// Enlève les zéros inutiles après la virgule (9.50 -> 9.5, 12.00 -> 12), le
// score cumulant des points fractionnaires (1, 1/2, 1/3 selon le type).
function formatScore(value) {
  return value.toFixed(2).replace(/\.?0+$/, '')
}

function ObjectiveCard({ viewedUserId, isMine, score }) {
  // Garde le userId avec le résultat : si viewedUserId change (bascule
  // Mine/Partenaire) avant que la requête ne revienne, ce résultat est
  // "périmé" et on retombe sur l'état de chargement au lieu d'afficher
  // brièvement l'objectif de l'autre.
  const [result, setResult] = useState({ userId: null, goal: null, error: null })
  const isStale = result.userId !== viewedUserId
  const goal = isStale ? null : result.goal
  const loadError = isStale ? null : result.error

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!viewedUserId) return
    let active = true
    getAnnualGoal(viewedUserId)
      .then((g) => {
        if (active) setResult({ userId: viewedUserId, goal: g, error: null })
      })
      .catch((err) => {
        if (active) {
          setResult({ userId: viewedUserId, goal: null, error: describeError(err) })
        }
      })
    return () => {
      active = false
    }
  }, [viewedUserId])

  function startEditing() {
    setDraft(String(goal ?? 12))
    setEditing(true)
    setSaveError(null)
  }

  async function submit() {
    const value = Number(draft)
    if (!value || value <= 0) {
      setSaveError('Entre un nombre positif.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await updateAnnualGoal(value)
      setResult({ userId: viewedUserId, goal: value, error: null })
      setEditing(false)
    } catch (err) {
      setSaveError(describeError(err))
    } finally {
      setSaving(false)
    }
  }

  const year = new Date().getFullYear()
  const pct = goal ? Math.min(100, Math.round((score / goal) * 100)) : 0

  return (
    <section className="bg-card border-t-4 border-dashed border-library rounded-sm shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-lg">Objectif {year}</h2>
        {isMine && !editing && goal != null && (
          <button
            type="button"
            onClick={startEditing}
            className="text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            Modifier l'objectif
          </button>
        )}
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-stamp">
          {loadError}
        </p>
      ) : goal == null ? (
        <p className="text-sm text-ink/50">Chargement…</p>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="0.5"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-24 rounded-sm border border-ink/20 bg-white px-2 py-1 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm disabled:opacity-60"
          >
            {saving ? 'Enregistrement…' : 'Valider'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs text-ink/50 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            Annuler
          </button>
        </div>
      ) : (
        <>
          <p className="font-mono text-3xl font-semibold text-library">
            {formatScore(score)}
            <span className="text-lg text-ink/40 font-normal"> / {goal}</span>
          </p>
          <div className="h-3 w-full rounded-full bg-ink/5 overflow-hidden mt-3">
            <div
              className="h-full bg-library rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-ink/50 mt-2">
            {pct}% de l'objectif · 1 livre = 1 pt, BD/Comics = 0,5 pt, Manga =
            1/3 pt
          </p>
        </>
      )}
      {saveError && (
        <p role="alert" className="text-xs text-stamp mt-2">
          {saveError}
        </p>
      )}
    </section>
  )
}

const PAGE_SIZE = 6

// Les listes Par tag/éditeur/collection/série peuvent compter des dizaines
// d'entrées : on les pagine plutôt que de dérouler un mur de texte.
function PaginatedList({ items, children }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const clampedPage = Math.min(page, pageCount - 1)
  const visible = items.slice(
    clampedPage * PAGE_SIZE,
    clampedPage * PAGE_SIZE + PAGE_SIZE,
  )

  return (
    <>
      <ul className="space-y-3">{visible.map(children)}</ul>
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm disabled:opacity-30 disabled:no-underline"
          >
            ← Précédent
          </button>
          <span className="text-xs text-ink/40 font-mono">
            {clampedPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={clampedPage === pageCount - 1}
            className="text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm disabled:opacity-30 disabled:no-underline"
          >
            Suivant →
          </button>
        </div>
      )}
    </>
  )
}

function RenameableStatRow({
  name,
  count,
  max,
  colorClass,
  existingNames,
  onRename,
  onRenamed,
  isMine,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [confirmingMerge, setConfirmingMerge] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const trimmed = draft.trim()
  const collidingName = existingNames.find(
    (n) => n !== name && n.toLowerCase() === trimmed.toLowerCase(),
  )

  function startEditing() {
    setDraft(name)
    setEditing(true)
    setConfirmingMerge(false)
    setError(null)
  }

  function cancel() {
    setEditing(false)
    setConfirmingMerge(false)
    setError(null)
  }

  async function submit() {
    if (!trimmed || trimmed === name) {
      cancel()
      return
    }
    if (collidingName && !confirmingMerge) {
      setConfirmingMerge(true)
      return
    }
    setWorking(true)
    setError(null)
    try {
      await onRename(name, trimmed)
      await onRenamed()
      setEditing(false)
      setConfirmingMerge(false)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setWorking(false)
    }
  }

  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setConfirmingMerge(false)
            }}
            autoFocus
            className="text-sm border-b border-ink/30 bg-transparent focus:outline-none focus:border-library flex-1 min-w-0"
          />
        ) : (
          <span className="text-sm truncate">{name}</span>
        )}
        <span className="font-mono text-xs text-ink/60 shrink-0">{count}</span>
      </div>
      <CountBar count={count} max={max} colorClass={colorClass} />
      {editing ? (
        <div className="mt-1 space-y-1">
          {confirmingMerge && (
            <p className="text-xs text-stamp">
              « {collidingName} » existe déjà : les livres seront regroupés
              ensemble. Confirmer ?
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-stamp">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={working}
              className="text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm disabled:opacity-60"
            >
              {working
                ? 'Renommage…'
                : confirmingMerge
                  ? 'Confirmer la fusion'
                  : 'Valider'}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="text-xs text-ink/50 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        isMine && (
          <button
            type="button"
            onClick={startEditing}
            className="mt-1 text-xs text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            Renommer
          </button>
        )
      )}
    </li>
  )
}

function CountBar({ count, max, colorClass = 'bg-library' }) {
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
