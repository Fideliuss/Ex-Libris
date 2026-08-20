import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listBooks } from '../lib/books'
import BookCard from '../components/BookCard'

export default function Collection() {
  const { user, signOut } = useAuth()
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
        <button
          type="button"
          onClick={() => signOut()}
          className="shrink-0 rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:text-stamp hover:border-stamp focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        >
          Se déconnecter
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6">
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
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
