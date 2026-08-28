import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bulkDeleteBooks, bulkUpdateBooks } from '../lib/books'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import { describeError } from '../lib/errors'
import BookCard from '../components/BookCard'
import CollectionFilters from '../components/CollectionFilters'
import BulkActionBar from '../components/BulkActionBar'
import HouseholdSwitchBadge from '../components/HouseholdSwitchBadge'
import TabBar from '../components/TabBar'
import LoadingScreen from '../components/LoadingScreen'
import { STATUS_LABELS } from '../lib/statusLabels'
import { authorSortKey } from '../lib/authorSort'

const STATUS_ORDER = Object.keys(STATUS_LABELS)

const SORT_OPTIONS = {
  recent: {
    label: 'Récemment ajoutés',
    compare: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  },
  title: {
    label: 'Titre (A→Z)',
    compare: (a, b) => a.title.localeCompare(b.title, 'fr'),
  },
  author: {
    label: 'Auteur (nom, A→Z)',
    compare: (a, b) =>
      authorSortKey(a.author).localeCompare(authorSortKey(b.author), 'fr'),
  },
  rating: {
    label: 'Note (meilleure d’abord)',
    compare: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  },
  finished: {
    label: 'Date de fin de lecture',
    compare: (a, b) =>
      new Date(b.date_finished ?? 0) - new Date(a.date_finished ?? 0),
  },
  tome: {
    label: 'Tome (croissant)',
    compare: (a, b) => (a.series_index ?? 0) - (b.series_index ?? 0),
  },
  status: {
    label: 'Statut',
    compare: (a, b) =>
      STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  },
}

// Les champs date_finished sont des "date" Postgres (pas d'heure) : les
// parser avec `new Date(string)` les interprète en UTC et peut décaler d'un
// jour selon le fuseau du navigateur. On construit la date en local.
function parseDateOnly(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    date,
  )
}

// Détermine l'en-tête de section pour un livre selon le tri actif (lettre,
// mois, statut), ou `null` si ce tri ne se groupe pas naturellement (note,
// tome) ou si le champ concerné est vide pour ce livre.
function groupKeyFor(book, sortKey) {
  if (sortKey === 'title') return book.title[0].toUpperCase()
  if (sortKey === 'author') {
    const key = authorSortKey(book.author)
    return key ? key[0].toUpperCase() : null
  }
  if (sortKey === 'recent') return monthLabel(new Date(book.created_at))
  if (sortKey === 'finished')
    return book.date_finished ? monthLabel(parseDateOnly(book.date_finished)) : null
  if (sortKey === 'status') return STATUS_LABELS[book.status] ?? null
  return null
}

export default function Collection() {
  const { user, signOut } = useAuth()
  const { partner, isMine, books, loading, error, refresh, setView } =
    useHouseholdBooks()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  // Filtres/tri/recherche vivent dans l'URL (et non un useState local) pour
  // survivre à un aller-retour vers la fiche d'un livre : la page se
  // démonte/remonte à chaque navigation, un useState repartirait à zéro.
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('q') ?? ''
  const selectedTags = searchParams.getAll('tag')
  const publisher = searchParams.get('publisher') ?? ''
  const collection = searchParams.get('collection') ?? ''
  const series = searchParams.get('series') ?? ''
  const universe = searchParams.get('universe') ?? ''
  const type = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const sort = searchParams.get('sort') ?? 'recent'
  const collectionTab = searchParams.get('tab') ?? 'collection'

  function setParam(key, value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (!value) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const setSearch = (value) => setParam('q', value)
  const setPublisher = (value) => setParam('publisher', value)
  const setCollection = (value) => setParam('collection', value)
  const setUniverse = (value) => setParam('universe', value)
  const setType = (value) => setParam('type', value)
  const setStatus = (value) => setParam('status', value)
  const setSort = (value) => setParam('sort', value)

  function setCollectionTab(next) {
    setParam('tab', next === 'collection' ? null : next)
    exitSelectionMode()
  }

  function setSelectedTags(nextTags) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('tag')
        for (const t of nextTags) next.append('tag', t)
        return next
      },
      { replace: true },
    )
  }

  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [bulkError, setBulkError] = useState(null)

  const tags = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      for (const t of book.tags ?? []) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books])

  const selectedBooksTags = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      if (!selectedIds.has(book.id)) continue
      for (const t of book.tags ?? []) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books, selectedIds])

  const publishers = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      if (book.publisher) set.add(book.publisher)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books])

  const collections = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      if (book.collection) set.add(book.collection)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books])

  const seriesList = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      if (book.series) set.add(book.series)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books])

  const universeList = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      if (book.universe) set.add(book.universe)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books])

  // Livres sans couverture ou sans les champs qu'un scan ISBN réussi remplit
  // normalement tout seul (auteur, éditeur, pages, description) : à
  // compléter à la main.
  const incompleteBooks = useMemo(() => {
    return books.filter(
      (book) =>
        !book.cover_url ||
        !book.author ||
        !book.publisher ||
        !book.page_count ||
        !book.description,
    )
  }, [books])

  const sortedIncompleteBooks = useMemo(
    () => [...incompleteBooks].sort(SORT_OPTIONS[sort].compare),
    [incompleteBooks, sort],
  )

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return books.filter((book) => {
      if (query) {
        const isbn = (book.isbn ?? '').replace(/[\s-]/g, '')
        const haystack = `${book.title} ${book.author ?? ''} ${isbn}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (
        selectedTags.length > 0 &&
        !selectedTags.some((t) => book.tags?.includes(t))
      )
        return false
      if (publisher && book.publisher !== publisher) return false
      if (collection && book.collection !== collection) return false
      if (series && book.series !== series) return false
      if (universe && book.universe !== universe) return false
      if (type && book.type !== type) return false
      if (status && book.status !== status) return false
      return true
    })
  }, [
    books,
    search,
    selectedTags,
    publisher,
    collection,
    series,
    universe,
    type,
    status,
  ])

  const sortedBooks = useMemo(
    () => [...filteredBooks].sort(SORT_OPTIONS[sort].compare),
    [filteredBooks, sort],
  )

  const visibleBooks =
    collectionTab === 'todo' ? sortedIncompleteBooks : sortedBooks

  // Une entrée "header" avant chaque nouveau groupe (lettre/mois/statut),
  // ou juste les livres si le tri actif ne se groupe pas (note, tome).
  const gridItems = useMemo(() => {
    const items = []
    let lastKey
    for (const book of visibleBooks) {
      const key = groupKeyFor(book, sort)
      if (key !== null && key !== lastKey) {
        items.push({ type: 'header', renderKey: `h-${key}`, label: key })
      }
      items.push({ type: 'book', renderKey: book.id, book })
      lastKey = key
    }
    return items
  }, [visibleBooks, sort])

  const hasActiveFilters = Boolean(
    search ||
      selectedTags.length > 0 ||
      publisher ||
      collection ||
      series ||
      universe ||
      type ||
      status,
  )

  function resetFilters() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of [
          'q',
          'tag',
          'publisher',
          'collection',
          'series',
          'universe',
          'type',
          'status',
        ]) {
          next.delete(key)
        }
        return next
      },
      { replace: true },
    )
  }

  function handleSeriesChange(next) {
    // Regarder une série précise ? Le tri par tome est presque toujours ce
    // qu'on veut, plutôt que l'ordre d'ajout par défaut.
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next) {
          params.set('series', next)
          params.set('sort', 'tome')
        } else {
          params.delete('series')
        }
        return params
      },
      { replace: true },
    )
  }

  function switchView(next) {
    setView(next)
    resetFilters()
    exitSelectionMode()
  }

  function handleStartSelection(id) {
    setSelectionMode(true)
    setSelectedIds(new Set([id]))
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === visibleBooks.length
        ? new Set()
        : new Set(visibleBooks.map((b) => b.id)),
    )
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setBulkError(null)
  }

  async function runBulkAction(fn) {
    setBulkWorking(true)
    setBulkError(null)
    try {
      await fn()
      await refresh()
      exitSelectionMode()
    } catch (err) {
      setBulkError(describeError(err))
    } finally {
      setBulkWorking(false)
    }
  }

  function handleBulkDelete() {
    return runBulkAction(() => bulkDeleteBooks([...selectedIds]))
  }

  function handleBulkStatus(newStatus) {
    return runBulkAction(() =>
      bulkUpdateBooks(
        [...selectedIds].map((id) => ({ id, patch: { status: newStatus } })),
      ),
    )
  }

  function handleBulkType(newType) {
    return runBulkAction(() =>
      bulkUpdateBooks(
        [...selectedIds].map((id) => ({ id, patch: { type: newType } })),
      ),
    )
  }

  function handleBulkAddTag(newTag) {
    const clean = newTag.trim()
    if (!clean) return Promise.resolve()
    return runBulkAction(() =>
      bulkUpdateBooks(
        [...selectedIds].map((id) => {
          const book = books.find((b) => b.id === id)
          return {
            id,
            patch: { tags: [...new Set([...(book?.tags ?? []), clean])] },
          }
        }),
      ),
    )
  }

  function handleBulkRemoveTag(tagsToRemove) {
    if (!tagsToRemove?.length) return Promise.resolve()
    return runBulkAction(() =>
      bulkUpdateBooks(
        [...selectedIds].map((id) => {
          const book = books.find((b) => b.id === id)
          return {
            id,
            patch: {
              tags: (book?.tags ?? []).filter((t) => !tagsToRemove.includes(t)),
            },
          }
        }),
      ),
    )
  }

  return (
    <div className={`min-h-svh ${selectionMode ? 'pb-40' : 'pb-24'}`}>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between max-w-5xl mx-auto p-6 gap-4">
        <Link
          to="/"
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          <img src="/favicon.svg" alt="" className="w-7 h-7" />
          <span className="font-serif text-xl font-semibold">Ex Libris</span>
        </Link>
        <div className="flex items-start gap-2 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {partner && (
              <HouseholdSwitchBadge
                isMine={isMine}
                onSelectMine={() => switchView('mine')}
                onSelectPartner={() => switchView('partner')}
                partnerLabel={partner.label}
              />
            )}
            <Link
              to="/stats"
              className="rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              Statistiques
            </Link>
          </div>
          <div className="relative group shrink-0">
            <Link
              to="/account"
              title={user?.email}
              aria-label="Mon compte"
              className="w-9 h-9 rounded-full bg-library text-white font-mono text-sm flex items-center justify-center hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-library focus-visible:ring-offset-2"
            >
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </Link>
            <div className="absolute right-0 top-full pt-1 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity z-30">
              <div className="rounded-sm border border-ink/10 bg-card shadow-sm py-1">
                <Link
                  to="/account"
                  className="block px-3 py-2 text-sm text-ink/70 hover:bg-paper hover:text-ink focus:outline-none focus-visible:bg-paper"
                >
                  Mon compte
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-sm text-ink/70 hover:bg-paper hover:text-stamp focus:outline-none focus-visible:bg-paper"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main key={isMine ? 'mine' : 'partner'} className="max-w-5xl mx-auto px-6 fade-in">
        {!loading && !error && books.length > 0 && (
          <TabBar
            tabs={[
              { key: 'collection', label: 'Collection' },
              {
                key: 'todo',
                label:
                  incompleteBooks.length > 0
                    ? `À traiter (${incompleteBooks.length})`
                    : 'À traiter',
              },
            ]}
            active={collectionTab}
            onChange={setCollectionTab}
            ariaLabel="Vue de la collection"
          />
        )}

        {!loading && !error && books.length > 0 && collectionTab === 'collection' && (
          <CollectionFilters
            search={search}
            onSearchChange={setSearch}
            selectedTags={selectedTags}
            onSelectedTagsChange={setSelectedTags}
            tags={tags}
            publisher={publisher}
            onPublisherChange={setPublisher}
            publishers={publishers}
            collection={collection}
            onCollectionChange={setCollection}
            collections={collections}
            series={series}
            onSeriesChange={handleSeriesChange}
            seriesList={seriesList}
            universe={universe}
            onUniverseChange={setUniverse}
            universeList={universeList}
            type={type}
            onTypeChange={setType}
            status={status}
            onStatusChange={setStatus}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          />
        )}

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : error ? (
          <p role="alert" className="text-sm text-stamp text-center py-16">
            Erreur : {error}
          </p>
        ) : books.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl mb-2">
              {isMine
                ? 'Ta bibliothèque est vide'
                : `La bibliothèque de ${partner?.label} est vide`}
            </p>
            {isMine ? (
              <>
                <p className="text-sm text-ink/60 mb-6">
                  Ajoute ton premier livre pour commencer à suivre tes
                  lectures.
                </p>
                <Link
                  to="/books/new"
                  className="inline-block rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
                >
                  Ajouter un livre
                </Link>
              </>
            ) : (
              <p className="text-sm text-ink/60">
                Rien à afficher pour l'instant.
              </p>
            )}
          </div>
        ) : collectionTab === 'todo' && incompleteBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl mb-2">Tout est renseigné 🎉</p>
            <p className="text-sm text-ink/60">
              Aucun livre à compléter pour l'instant.
            </p>
          </div>
        ) : collectionTab === 'collection' && filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-serif text-xl mb-2">
              Aucun livre ne correspond
            </p>
            <p className="text-sm text-ink/60 mb-6">
              Essaie d'autres critères de recherche ou de filtres.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-sm border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 mb-3">
              {selectionMode ? (
                <div className="flex items-center gap-3">
                  <p className="font-mono text-xs text-ink/50">
                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                  </p>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs text-library underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    {selectedIds.size === visibleBooks.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                </div>
              ) : (
                <p className="font-mono text-xs text-ink/50">
                  {collectionTab === 'todo' ? (
                    <>
                      {visibleBooks.length} livre
                      {visibleBooks.length > 1 ? 's' : ''} à traiter
                    </>
                  ) : (
                    <>
                      {filteredBooks.length} livre
                      {filteredBooks.length > 1 ? 's' : ''}
                      {hasActiveFilters ? ` sur ${books.length}` : ''}
                    </>
                  )}
                </p>
              )}
              <div className="flex items-center gap-2">
                {isMine && (
                  <button
                    type="button"
                    onClick={() =>
                      selectionMode ? exitSelectionMode() : setSelectionMode(true)
                    }
                    className="text-xs text-ink/50 hover:text-library underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    {selectionMode ? 'Annuler' : 'Sélectionner'}
                  </button>
                )}
                {!selectionMode && (
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Trier par"
                    className="rounded-sm border border-ink/20 bg-surface px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                  >
                    {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {gridItems.map((item) =>
                item.type === 'header' ? (
                  <p
                    key={item.renderKey}
                    className="col-span-full font-mono text-xs uppercase tracking-widest text-ink/50 border-b border-ink/10 pb-1 mt-2 first:mt-0"
                  >
                    {item.label}
                  </p>
                ) : (
                  <BookCard
                    key={item.renderKey}
                    book={item.book}
                    selectable={selectionMode}
                    selected={selectedIds.has(item.book.id)}
                    onToggleSelect={toggleSelect}
                    onStartSelection={isMine ? handleStartSelection : undefined}
                  />
                ),
              )}
            </div>
          </>
        )}
      </main>

      {selectionMode ? (
        <BulkActionBar
          count={selectedIds.size}
          working={bulkWorking}
          error={bulkError}
          tags={selectedBooksTags}
          onDelete={handleBulkDelete}
          onChangeStatus={handleBulkStatus}
          onChangeType={handleBulkType}
          onAddTag={handleBulkAddTag}
          onRemoveTag={handleBulkRemoveTag}
          onCancel={exitSelectionMode}
        />
      ) : (
        isMine && (
          <Link
            to="/books/new"
            aria-label="Ajouter un livre"
            className="fixed bottom-6 right-6 flex items-center justify-center gap-2 w-14 h-14 sm:w-auto sm:h-auto sm:px-5 sm:py-3 rounded-full bg-library text-white shadow-lg hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
          >
            <span className="text-3xl sm:text-xl leading-none" aria-hidden="true">
              +
            </span>
            <span className="hidden sm:inline text-sm font-medium">
              Ajouter un livre
            </span>
          </Link>
        )
      )}
    </div>
  )
}
