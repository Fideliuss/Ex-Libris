import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import {
  convertTagToCollection,
  renameCollection,
  renamePublisher,
  renameSeries,
} from '../lib/books'
import { useReadingGoals } from '../hooks/useReadingGoals'
import {
  averageRating,
  booksFinishedInPeriod,
  breakdownForYear,
  computePaceStats,
  computePeriodRange,
  computeRatingBars,
  countBy,
  coverWall,
  latestFinishedByType,
  monthlyFinishedBuckets,
  scoreForYear,
  statusTotals,
  tagStatistics,
  typeCounts,
} from '../lib/stats'
import { describeError } from '../lib/errors'
import { formatDate } from '../lib/dates'
import { BOOK_TYPES } from '../lib/bookTypes'
import { STATUS_LABELS } from '../lib/statusLabels'
import { labelClass, linkButtonClass, cardClass } from '../lib/ui'
import HouseholdPage from '../components/HouseholdPage'
import TabBar from '../components/TabBar'
import StatusStackedBar from '../components/StatusStackedBar'
import BarChart from '../components/BarChart'
import DonutChart from '../components/DonutChart'
import ReadingHeatmap from '../components/ReadingHeatmap'
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

export default function Stats() {
  const { members, ownerId, isMine, books, loading, error, refresh, setOwnerId } =
    useHouseholdBooks()
  const viewedUserId = ownerId
  const readingGoals = useReadingGoals(viewedUserId)
  const selectedMember = members.find((m) => m.userId === ownerId)
  const selectedLabel = selectedMember?.displayName ?? selectedMember?.email
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

  const { readCount, readingCount, toReadCount, wishlistCount, totalSpent } = useMemo(
    () => statusTotals(books),
    [books],
  )
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

  const currentYearScore = useMemo(() => scoreForYear(books, new Date()), [books])

  const currentYearBreakdown = useMemo(() => breakdownForYear(books, new Date()), [books])

  const lastFinishedByType = useMemo(() => latestFinishedByType(books), [books])

  const typeSegments = useMemo(() => {
    const colorByType = {
      book: 'text-library',
      bd: 'text-brass',
      comics: 'text-wishlist',
      manga: 'text-reading',
    }
    const counts = typeCounts(books)
    return Object.entries(BOOK_TYPES).map(([key, label]) => ({
      key,
      label,
      value: counts[key],
      colorClass: colorByType[key],
    }))
  }, [books])

  const tagStats = useMemo(() => tagStatistics(books), [books])

  const publisherStats = useMemo(() => countBy(books, 'publisher', 'publisher'), [books])

  const collectionStats = useMemo(() => countBy(books, 'collection', 'collection'), [books])

  const seriesStats = useMemo(() => countBy(books, 'series', 'series'), [books])

  const periodRange = useMemo(
    () => computePeriodRange(period, customFrom, customTo, new Date()),
    [period, customFrom, customTo],
  )

  const finishedInPeriod = useMemo(
    () => booksFinishedInPeriod(books, periodRange),
    [books, periodRange],
  )

  const monthlyFinished = useMemo(
    () => monthlyFinishedBuckets(finishedInPeriod, periodRange),
    [finishedInPeriod, periodRange],
  )

  const paceStats = useMemo(
    () => computePaceStats(finishedInPeriod, periodRange),
    [finishedInPeriod, periodRange],
  )

  const ratingBars = useMemo(() => computeRatingBars(finishedInPeriod), [finishedInPeriod])

  const avgRating = useMemo(() => averageRating(finishedInPeriod), [finishedInPeriod])

  const coverWallBooks = useMemo(() => coverWall(finishedInPeriod), [finishedInPeriod])

  const maxTagCount = tagStats[0]?.count ?? 0
  const maxPublisherCount = publisherStats[0]?.count ?? 0
  const maxCollectionCount = collectionStats[0]?.count ?? 0
  const maxSeriesCount = seriesStats[0]?.count ?? 0

  return (
    <HouseholdPage
      title="Statistiques"
      members={members}
      ownerId={ownerId}
      onSelectOwner={setOwnerId}
      loading={loading}
      error={error}
      emptyMessage={
        books.length === 0
          ? isMine
            ? 'Ajoute des livres à ta collection pour voir apparaître tes statistiques.'
            : `${selectedLabel} n'a pas encore de livres.`
          : null
      }
    >
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
    </HouseholdPage>
  )
}
