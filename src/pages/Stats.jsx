import { useMemo, useState } from 'react'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import {
  convertTagToCollection,
  renameCollection,
  renamePublisher,
  renameSeries,
} from '../lib/books'
import { describeError } from '../lib/errors'
import { useGoBack } from '../lib/navigation'
import HouseholdTabs from '../components/HouseholdTabs'
import MonthlyFinishedChart from '../components/MonthlyFinishedChart'
import LoadingScreen from '../components/LoadingScreen'

export default function Stats() {
  const { partner, isMine, books, loading, error, refresh, setView } =
    useHouseholdBooks()
  const goBack = useGoBack('/')
  const [convertingTag, setConvertingTag] = useState(null)
  const [convertError, setConvertError] = useState(null)

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatTile label="Total" value={totalCount} />
              <StatTile label="Lus" value={readCount} accent="text-stamp" />
              <StatTile label="En cours" value={readingCount} />
              <StatTile label="À lire" value={toReadCount} />
              <StatTile label="Wishlist" value={wishlistCount} accent="text-brass" />
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

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      <RenameableStatRow
                        key={entry.publisher}
                        name={entry.publisher}
                        count={entry.count}
                        max={maxPublisherCount}
                        existingNames={publisherStats.map((e) => e.publisher)}
                        onRename={renamePublisher}
                        isMine={isMine}
                        onRenamed={refresh}
                      />
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
                <h2 className="font-serif text-lg mb-4">Par collection</h2>
                {collectionStats.length === 0 ? (
                  <p className="text-sm text-ink/50">
                    Aucune collection renseignée pour l'instant.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {collectionStats.map((entry) => (
                      <RenameableStatRow
                        key={entry.collection}
                        name={entry.collection}
                        count={entry.count}
                        max={maxCollectionCount}
                        existingNames={collectionStats.map((e) => e.collection)}
                        onRename={renameCollection}
                        isMine={isMine}
                        onRenamed={refresh}
                      />
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
                      <RenameableStatRow
                        key={entry.series}
                        name={entry.series}
                        count={entry.count}
                        max={maxSeriesCount}
                        existingNames={seriesStats.map((e) => e.series)}
                        onRename={renameSeries}
                        isMine={isMine}
                        onRenamed={refresh}
                      />
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

function RenameableStatRow({
  name,
  count,
  max,
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
      <CountBar count={count} max={max} />
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
