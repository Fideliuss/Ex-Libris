import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listBooks } from '../lib/books'
import BookCard from '../components/BookCard'
import CollectionFilters from '../components/CollectionFilters'

export default function Collection() {
  const { user, signOut } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [publisher, setPublisher] = useState('')
  const [series, setSeries] = useState('')
  const [status, setStatus] = useState('')

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

  const hasActiveFilters = Boolean(search || tag || publisher || series || status)

  function resetFilters() {
    setSearch('')
    setTag('')
    setPublisher('')
    setSeries('')
    setStatus('')
  }

  return (
    <div className="min-h-svh pb-24">
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
              Ta bibliothèque est vide
            </p>
            <p className="text-sm text-ink/60 mb-6">
              Ajoute ton premier livre pour commencer à suivre tes lectures.
            </p>
            <Link
              to="/books/new"
              className="inline-block rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
            >
              Ajouter un livre
            </Link>
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
            <p className="font-mono text-xs text-ink/50 mb-3">
              {filteredBooks.length} livre{filteredBooks.length > 1 ? 's' : ''}
              {hasActiveFilters ? ` sur ${books.length}` : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </>
        )}
      </main>

      <Link
        to="/books/new"
        aria-label="Ajouter un livre"
        className="fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-library text-white text-3xl leading-none shadow-lg hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
      >
        +
      </Link>
    </div>
  )
}
