import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bulkDeleteBooks, bulkUpdateBooks, listBooks } from '../lib/books'
import { getPartner } from '../lib/household'
import BookCard from '../components/BookCard'
import CollectionFilters from '../components/CollectionFilters'
import BulkActionBar from '../components/BulkActionBar'

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
    label: 'Auteur (A→Z)',
    compare: (a, b) => (a.author ?? '').localeCompare(b.author ?? '', 'fr'),
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
}

export default function Collection() {
  const { user, signOut } = useAuth()
  const partner = getPartner(user?.id)
  const [view, setView] = useState('mine') // 'mine' | 'partner'
  const [allBooks, setAllBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [publisher, setPublisher] = useState('')
  const [series, setSeries] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('recent')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [bulkWorking, setBulkWorking] = useState(false)
  const [bulkError, setBulkError] = useState(null)

  useEffect(() => {
    let active = true
    listBooks()
      .then((data) => {
        if (active) setAllBooks(data)
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

  const isMine = view === 'mine'
  const ownerId = isMine ? user?.id : partner?.id
  const books = useMemo(
    () => allBooks.filter((b) => b.user_id === ownerId),
    [allBooks, ownerId],
  )

  const tags = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      for (const t of book.tags ?? []) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [books])

  const publishers = useMemo(() => {
    const set = new Set()
    for (const book of books) {
      if (book.publisher) set.add(book.publisher)
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

  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return books.filter((book) => {
      if (query) {
        const haystack = `${book.title} ${book.author ?? ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      if (tag && !book.tags?.includes(tag)) return false
      if (publisher && book.publisher !== publisher) return false
      if (series && book.series !== series) return false
      if (status && book.status !== status) return false
      return true
    })
  }, [books, search, tag, publisher, series, status])

  const sortedBooks = useMemo(
    () => [...filteredBooks].sort(SORT_OPTIONS[sort].compare),
    [filteredBooks, sort],
  )

  const hasActiveFilters = Boolean(search || tag || publisher || series || status)

  function resetFilters() {
    setSearch('')
    setTag('')
    setPublisher('')
    setSeries('')
    setStatus('')
  }

  function switchView(next) {
    setView(next)
    resetFilters()
    exitSelectionMode()
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
      prev.size === sortedBooks.length
        ? new Set()
        : new Set(sortedBooks.map((b) => b.id)),
    )
  }

  function exitSelectionMode() {
    setSelectionMode(false)
    setSelectedIds(new Set())
    setBulkError(null)
  }

  async function refreshBooks() {
    const data = await listBooks()
    setAllBooks(data)
  }

  async function runBulkAction(fn) {
    setBulkWorking(true)
    setBulkError(null)
    try {
      await fn()
      await refreshBooks()
      exitSelectionMode()
    } catch (err) {
      setBulkError(err.message)
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

  function handleBulkAddTag(newTag) {
    const clean = newTag.trim()
    if (!clean) return Promise.resolve()
    return runBulkAction(() =>
      bulkUpdateBooks(
        [...selectedIds].map((id) => {
          const book = allBooks.find((b) => b.id === id)
          return {
            id,
            patch: { tags: [...new Set([...(book?.tags ?? []), clean])] },
          }
        }),
      ),
    )
  }

  return (
    <div className={`min-h-svh ${selectionMode ? 'pb-40' : 'pb-24'}`}>
      <header className="flex items-start justify-between max-w-5xl mx-auto p-6 gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-library uppercase mb-1">
            {user?.email}
          </p>
          <h1 className="font-serif text-2xl font-semibold">
            Ma Bibliothèque
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0">
          <Link
            to="/import"
            className="rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
          >
            Importer
          </Link>
          <Link
            to="/stats"
            className="rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
          >
            Statistiques
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:text-stamp hover:border-stamp focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        {partner && (
          <div className="flex gap-2 mb-6" role="tablist" aria-label="Bibliothèque à afficher">
            <button
              type="button"
              role="tab"
              aria-selected={isMine}
              onClick={() => switchView('mine')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
                isMine
                  ? 'bg-library text-white'
                  : 'border border-ink/20 text-ink/70 hover:border-library hover:text-library'
              }`}
            >
              Ma bibliothèque
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isMine}
              onClick={() => switchView('partner')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
                !isMine
                  ? 'bg-library text-white'
                  : 'border border-ink/20 text-ink/70 hover:border-library hover:text-library'
              }`}
            >
              Bibliothèque de {partner.label}
            </button>
          </div>
        )}

        {!loading && !error && books.length > 0 && (
          <CollectionFilters
            search={search}
            onSearchChange={setSearch}
            tag={tag}
            onTagChange={setTag}
            tags={tags}
            publisher={publisher}
            onPublisherChange={setPublisher}
            publishers={publishers}
            series={series}
            onSeriesChange={setSeries}
            seriesList={seriesList}
            status={status}
            onStatusChange={setStatus}
            hasActiveFilters={hasActiveFilters}
            onReset={resetFilters}
          />
        )}

        {loading ? (
          <p className="font-mono text-sm text-ink/60 text-center py-16">
            Chargement…
          </p>
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
        ) : filteredBooks.length === 0 ? (
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
                    {selectedIds.size === sortedBooks.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </button>
                </div>
              ) : (
                <p className="font-mono text-xs text-ink/50">
                  {filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''}
                  {hasActiveFilters ? ` sur ${books.length}` : ''}
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
                    className="rounded-sm border border-ink/20 bg-white px-2 py-1 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
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
              {sortedBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  selectable={selectionMode}
                  selected={selectedIds.has(book.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {selectionMode ? (
        <BulkActionBar
          count={selectedIds.size}
          working={bulkWorking}
          error={bulkError}
          onDelete={handleBulkDelete}
          onChangeStatus={handleBulkStatus}
          onAddTag={handleBulkAddTag}
          onCancel={exitSelectionMode}
        />
      ) : (
        isMine && (
          <Link
            to="/books/new"
            aria-label="Ajouter un livre"
            className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-library text-white text-3xl leading-none shadow-lg hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
          >
            +
          </Link>
        )
      )}
    </div>
  )
}
