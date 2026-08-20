import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listBooks, createBook, deleteBook } from '../lib/books'

export default function Collection() {
  const { user, signOut } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [working, setWorking] = useState(false)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setBooks(await listBooks())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAddTestBook() {
    setWorking(true)
    setError(null)
    try {
      await createBook({
        title: `Livre test ${new Date().toLocaleTimeString('fr-FR')}`,
        author: 'Auteur test',
        status: 'to-read',
      })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  async function handleDelete(id) {
    setWorking(true)
    setError(null)
    try {
      await deleteBook(id)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="min-h-svh p-6">
      <header className="flex items-start justify-between max-w-3xl mx-auto mb-8 gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-library uppercase mb-1">
            Étape 3 / 10 — test CRUD
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

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
          <p className="text-sm text-ink/70 mb-4">
            Connecté en tant que{' '}
            <span className="font-mono text-ink">{user?.email}</span>. Ce
            panneau sert à vérifier que la table Supabase et les règles de
            sécurité fonctionnent — le vrai formulaire d'ajout arrive à
            l'étape 4.
          </p>
          <button
            type="button"
            onClick={handleAddTestBook}
            disabled={working}
            className="rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
          >
            {working ? 'Traitement…' : 'Ajouter un livre test'}
          </button>

          {error && (
            <p role="alert" className="text-sm text-stamp mt-3">
              Erreur : {error}
            </p>
          )}
        </div>

        <div>
          {loading ? (
            <p className="font-mono text-sm text-ink/60 text-center py-8">
              Chargement…
            </p>
          ) : books.length === 0 ? (
            <p className="text-sm text-ink/60 text-center py-8">
              Aucun livre pour l'instant.
            </p>
          ) : (
            <ul className="space-y-2">
              {books.map((book) => (
                <li
                  key={book.id}
                  className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-serif text-lg">{book.title}</p>
                    <p className="text-sm text-ink/60">
                      {book.author} ·{' '}
                      <span className="font-mono text-xs">
                        {book.status}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(book.id)}
                    disabled={working}
                    className="shrink-0 rounded-sm border border-stamp/40 text-stamp px-3 py-2 text-sm hover:bg-stamp hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
