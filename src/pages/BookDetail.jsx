import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getBook } from '../lib/books'

const statusLabel = {
  wishlist: 'Souhaité',
  'to-read': 'À lire',
  reading: 'En cours',
  read: 'Lu',
}

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getBook(id)
      .then((data) => {
        if (active) setBook(data)
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
  }, [id])

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="font-mono text-sm text-ink/60">Chargement…</p>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-svh flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-card border-t-4 border-dashed border-stamp rounded-sm shadow-sm p-8 text-center">
          <p className="text-sm text-stamp mb-4">
            {error ?? 'Livre introuvable.'}
          </p>
          <Link
            to="/"
            className="text-sm text-library underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ← Retour à la collection
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <Link
            to="/"
            className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ← Retour à la collection
          </Link>
          <button
            type="button"
            onClick={() => navigate(`/books/${id}/edit`)}
            className="shrink-0 rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
          >
            Modifier
          </button>
        </div>

        <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
          <div className="flex gap-6 flex-col sm:flex-row">
            <div className="relative w-40 aspect-[2/3] shrink-0 rounded-sm border border-ink/10 bg-paper overflow-hidden mx-auto sm:mx-0">
              {book.status === 'read' && (
                <span className="absolute top-2 right-2 -rotate-6 border-2 border-stamp text-stamp font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-card/90">
                  Lu
                </span>
              )}
              {book.cover_url ? (
                <img
                  src={book.cover_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-ink/30 text-sm px-4 text-center">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-2xl font-semibold">
                {book.title}
              </h1>
              {book.author && (
                <p className="text-ink/70 mt-1">{book.author}</p>
              )}
              {book.publisher && (
                <p className="text-sm text-ink/50 mt-0.5">{book.publisher}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="font-mono text-xs uppercase text-ink/50 border border-ink/20 rounded-full px-2 py-0.5">
                  {statusLabel[book.status] ?? book.status}
                </span>
                {book.rating > 0 && (
                  <span className="text-brass text-sm" aria-hidden="true">
                    {'★'.repeat(book.rating)}
                    {'☆'.repeat(5 - book.rating)}
                  </span>
                )}
              </div>

              {book.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {book.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-library text-white text-xs px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {book.description && (
            <div className="mt-6 pt-6 border-t border-ink/10">
              <h2 className="font-serif text-lg mb-2">Résumé</h2>
              <p className="text-sm text-ink/70 whitespace-pre-line">
                {book.description}
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-ink/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <DetailField label="ISBN" value={book.isbn} mono />
            <DetailField label="Pages" value={book.page_count} mono />
            <DetailField label="Date de début" value={formatDate(book.date_started)} />
            <DetailField label="Date de fin" value={formatDate(book.date_finished)} />
            <DetailField label="Date d'achat" value={formatDate(book.purchase_date)} />
            <DetailField
              label="Prix"
              value={book.price != null ? `${Number(book.price).toFixed(2)} €` : null}
              mono
            />
          </div>

          {book.notes && (
            <div className="mt-6 pt-6 border-t border-ink/10">
              <h2 className="font-serif text-lg mb-2">Notes</h2>
              <p className="text-sm text-ink/70 whitespace-pre-line">
                {book.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailField({ label, value, mono }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <p className="text-xs text-ink/50">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function formatDate(value) {
  if (!value) return null
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}
