import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getBook } from '../lib/books'
import { useAuth } from '../context/AuthContext'
import { getMemberLabel } from '../lib/household'
import {
  STATUS_BADGE_CLASS,
  STATUS_BORDER_CLASS,
  STATUS_LABELS,
} from '../lib/statusLabels'
import { describeError } from '../lib/errors'
import { BOOK_TYPES } from '../lib/bookTypes'

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [coverExpanded, setCoverExpanded] = useState(false)

  useEffect(() => {
    if (!coverExpanded) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setCoverExpanded(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [coverExpanded])

  useEffect(() => {
    let active = true
    getBook(id)
      .then((data) => {
        if (active) setBook(data)
      })
      .catch((err) => {
        if (active) setError(describeError(err))
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
          {book.user_id === user?.id ? (
            <button
              type="button"
              onClick={() => navigate(`/books/${id}/edit`)}
              className="shrink-0 rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
            >
              Modifier
            </button>
          ) : (
            <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-brass">
              Livre de {getMemberLabel(book.user_id) ?? 'l’autre bibliothèque'}
            </span>
          )}
        </div>

        <div
          className={`bg-card border-t-4 border-dashed rounded-sm shadow-sm p-6 ${STATUS_BORDER_CLASS[book.status]}`}
        >
          <div className="flex gap-6 flex-col sm:flex-row">
            <div className="relative w-40 aspect-[2/3] shrink-0 rounded-sm border border-ink/10 bg-paper overflow-hidden mx-auto sm:mx-0">
              {book.status === 'read' && (
                <span className="absolute top-2 right-2 -rotate-6 border-2 border-library text-library font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-card/90 z-10">
                  Lu
                </span>
              )}
              {book.status === 'wishlist' && (
                <div
                  aria-hidden="true"
                  className="absolute -left-9 top-3 -rotate-45 w-32 text-center bg-wishlist text-white font-mono text-[10px] font-bold uppercase tracking-widest py-0.5 shadow"
                >
                  Souhaité
                </div>
              )}
              {book.cover_url ? (
                <button
                  type="button"
                  onClick={() => setCoverExpanded(true)}
                  aria-label="Agrandir la couverture"
                  className="w-full h-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                >
                  <img
                    src={book.cover_url}
                    alt=""
                    className="w-full h-full object-cover cursor-zoom-in"
                  />
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif text-ink/30 text-sm px-4 text-center">
                    {book.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {book.type === 'manga' && book.series ? (
                <>
                  <h1 className="font-serif text-2xl font-semibold">
                    {book.series}
                  </h1>
                  {book.series_index != null && (
                    <p className="font-mono text-base text-brass font-semibold mt-0.5">
                      Tome {book.series_index}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="font-serif text-2xl font-semibold">
                    {book.title}
                  </h1>
                  {book.series && (
                    <p className="text-sm text-brass mt-0.5">
                      {book.series}
                      {book.series_index != null && ` · Tome ${book.series_index}`}
                    </p>
                  )}
                </>
              )}
              {book.universe && (
                <p className="text-sm text-brass mt-0.5">
                  Univers : {book.universe}
                </p>
              )}
              {book.author && (
                <p className="text-ink/70 mt-1">{book.author}</p>
              )}
              {book.publisher && (
                <p className="text-sm text-ink/50 mt-0.5">{book.publisher}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`font-mono text-xs uppercase border border-ink/20 rounded-full px-2 py-0.5 ${STATUS_BADGE_CLASS[book.status] ?? 'text-ink/50'}`}
                >
                  {STATUS_LABELS[book.status] ?? book.status}
                </span>
                {book.type !== 'book' && (
                  <span className="font-mono text-xs uppercase text-ink/50 border border-ink/20 rounded-full px-2 py-0.5">
                    {BOOK_TYPES[book.type]}
                  </span>
                )}
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

      {coverExpanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Couverture en grand"
          onClick={() => setCoverExpanded(false)}
          className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-6"
        >
          <button
            type="button"
            onClick={() => setCoverExpanded(false)}
            aria-label="Fermer"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
          >
            ×
          </button>
          <img
            src={book.cover_url}
            alt={book.title}
            className="max-w-full max-h-full rounded-sm shadow-lg cursor-zoom-out"
          />
        </div>
      )}
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
