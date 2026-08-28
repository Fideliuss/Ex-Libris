import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getBook, getSeriesSiblings, updateBook } from '../lib/books'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import {
  STATUS_BADGE_CLASS,
  STATUS_BORDER_CLASS,
  STATUS_LABELS,
} from '../lib/statusLabels'
import { describeError } from '../lib/errors'
import { BOOK_TYPES } from '../lib/bookTypes'
import WishlistRibbon from '../components/WishlistRibbon'
import { navigateWithViewTransition, useGoBack } from '../lib/navigation'
import ReadingBookmark from '../components/ReadingBookmark'
import LoadingScreen from '../components/LoadingScreen'

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const goBack = useGoBack('/')
  const { user } = useAuth()
  const { partner } = useHouseholdBooks()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [coverExpanded, setCoverExpanded] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState(null)
  const [seriesSiblings, setSeriesSiblings] = useState([])

  async function handleStatusChange(newStatus) {
    setStatusSaving(true)
    setStatusError(null)
    try {
      const patch = { status: newStatus }
      if (newStatus === 'reading' && !book.date_started) {
        patch.date_started = todayDateOnly()
      }
      if (newStatus === 'read' && !book.date_finished) {
        patch.date_finished = todayDateOnly()
      }
      const updated = await updateBook(id, patch)
      setBook(updated)
    } catch (err) {
      setStatusError(describeError(err))
    } finally {
      setStatusSaving(false)
    }
  }

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

  // Les autres tomes de la série (même propriétaire), pour la navigation
  // tome par tome. Juste id/series_index : pas besoin de la fiche complète.
  useEffect(() => {
    if (!book?.series) return
    let active = true
    getSeriesSiblings(book.series, book.user_id)
      .then((data) => {
        if (active) setSeriesSiblings(data)
      })
      .catch(() => {
        if (active) setSeriesSiblings([])
      })
    return () => {
      active = false
    }
  }, [book?.series, book?.user_id])

  const visibleSiblings = book?.series ? seriesSiblings : []
  const siblingIndex = visibleSiblings.findIndex((s) => s.id === id)
  const prevSibling = siblingIndex > 0 ? visibleSiblings[siblingIndex - 1] : null
  const nextSibling =
    siblingIndex >= 0 && siblingIndex < visibleSiblings.length - 1
      ? visibleSiblings[siblingIndex + 1]
      : null

  // replace: true pour ne pas empiler un tome par hop dans l'historique —
  // sinon "Retour à la collection" doit défaire toute la chaîne de tomes
  // visités avant de revenir en arrière.
  const goToSibling = useCallback(
    (sibling, direction) => {
      if (!sibling) return
      setCoverExpanded(false)
      navigateWithViewTransition(navigate, `/books/${sibling.id}`, {
        direction,
        replace: true,
        preload: () => import('./BookDetail'),
      })
    },
    [navigate],
  )

  // Flèches du clavier : navigue vers le tome précédent/suivant, sauf si le
  // focus est dans un champ de formulaire (select du statut, etc.) ou que la
  // couverture est agrandie.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      if (coverExpanded) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' && prevSibling) goToSibling(prevSibling, 'back')
      if (e.key === 'ArrowRight' && nextSibling) goToSibling(nextSibling, 'forward')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevSibling, nextSibling, coverExpanded, goToSibling])

  if (loading) {
    return <LoadingScreen />
  }

  if (error || !book) {
    return (
      <div className="min-h-svh flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-card border-t-4 border-dashed border-stamp rounded-sm shadow-sm p-8 text-center">
          <p className="text-sm text-stamp mb-4">
            {error ?? 'Livre introuvable.'}
          </p>
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-library underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ← Retour à la collection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ← Retour à la collection
          </button>
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
              Livre de {partner?.label ?? 'l’autre bibliothèque'}
            </span>
          )}
        </div>

        <div
          className={`relative bg-card border-t-4 border-dashed rounded-sm shadow-sm p-6 ${STATUS_BORDER_CLASS[book.status]}`}
        >
          {book.created_at && (
            <p className="absolute top-3 right-4 font-mono text-[10px] text-ink/30">
              Ajouté le {formatDate(book.created_at.slice(0, 10))}
            </p>
          )}

          <div className="flex gap-6 flex-col sm:flex-row mt-3">
            <div className="relative w-40 aspect-[2/3] shrink-0 rounded-sm border border-ink/10 bg-paper overflow-hidden mx-auto sm:mx-0">
              {book.status === 'read' && (
                <span className="absolute top-2 right-2 -rotate-6 border-2 border-library text-library font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-card/90 z-10">
                  Lu
                </span>
              )}
              {book.status === 'wishlist' && <WishlistRibbon />}
              {book.status === 'reading' && <ReadingBookmark />}
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
                    className="w-full h-full object-contain cursor-zoom-in"
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
              {visibleSiblings.length > 1 && (
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => goToSibling(prevSibling, 'back')}
                    disabled={!prevSibling}
                    aria-label="Tome précédent"
                    className="text-sm text-library hover:text-library/80 disabled:text-ink/20 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    ‹
                  </button>
                  <span className="font-mono text-[11px] text-ink/40">
                    {siblingIndex + 1} / {visibleSiblings.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => goToSibling(nextSibling, 'forward')}
                    disabled={!nextSibling}
                    aria-label="Tome suivant"
                    className="text-sm text-library hover:text-library/80 disabled:text-ink/20 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    ›
                  </button>
                </div>
              )}
              {book.universe && (
                <p className="text-sm text-brass mt-0.5">
                  Univers : {book.universe}
                </p>
              )}
              {book.author && (
                <p className="text-ink/70 mt-1">{book.author}</p>
              )}
              {(book.translator || book.illustrator) && (
                <p className="text-xs text-ink/50 mt-0.5">
                  {book.translator && `Traduit par ${book.translator}`}
                  {book.translator && book.illustrator && ' · '}
                  {book.illustrator && `Illustré par ${book.illustrator}`}
                </p>
              )}
              {book.publisher && (
                <p className="text-sm text-ink/50 mt-0.5">
                  {book.publisher}
                  {book.collection && ` · ${book.collection}`}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {book.user_id === user?.id ? (
                  <select
                    value={book.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusSaving}
                    aria-label="Changer le statut"
                    className={`font-mono text-xs uppercase border border-ink/20 rounded-full px-2 py-0.5 bg-surface cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60 ${STATUS_BADGE_CLASS[book.status] ?? 'text-ink/50'}`}
                  >
                    <option value="wishlist">Wishlist</option>
                    <option value="to-read">À lire</option>
                    <option value="reading">En cours</option>
                    <option value="read">Lu</option>
                  </select>
                ) : (
                  <span
                    className={`font-mono text-xs uppercase border border-ink/20 rounded-full px-2 py-0.5 ${STATUS_BADGE_CLASS[book.status] ?? 'text-ink/50'}`}
                  >
                    {STATUS_LABELS[book.status] ?? book.status}
                  </span>
                )}
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

              {statusError && (
                <p role="alert" className="text-xs text-stamp mt-2">
                  {statusError}
                </p>
              )}

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

// `new Date().toISOString()` convertit en UTC et peut décaler d'un jour en
// soirée selon le fuseau ; on construit la date locale à la main, comme
// formatDate() ci-dessus.
function todayDateOnly() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
