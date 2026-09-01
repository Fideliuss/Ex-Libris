import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getBook, getSeriesSiblings, updateBook } from '../lib/books'
import { sortEditions, SPECIAL_EDITION_TYPES } from '../lib/editionTypes'
import SpecialEditionRibbon from '../components/SpecialEditionRibbon'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import {
  STATUS_BADGE_CLASS,
  STATUS_BORDER_CLASS,
  STATUS_LABELS,
} from '../lib/statusLabels'
import { describeError } from '../lib/errors'
import { BOOK_TYPES, SERIES_DRIVEN_TYPES } from '../lib/bookTypes'
import WishlistRibbon from '../components/WishlistRibbon'
import { navigateWithViewTransition, useGoBack } from '../lib/navigation'
import ReadingBookmark from '../components/ReadingBookmark'
import LoadingScreen from '../components/LoadingScreen'
import BookCoverPlaceholder from '../components/BookCoverPlaceholder'

// Au-delà de ce nombre de tomes manquants d'affilée, on compresse le trou en
// une seule chip "···" plutôt que d'en afficher une par tome manquant :
// sans ça, posséder les tomes 1 et 1000 d'une longue série générerait ~1000
// chips grisées.
const GAP_COLLAPSE_THRESHOLD = 3

// Construit la rangée de chips [tome possédé | tome manquant | trou
// compressé] entre le plus petit et le plus grand tome possédé (pas besoin
// de connaître la taille réelle de la série, juste l'étendue de ce qu'on a).
function buildTomeSlots(siblings) {
  const numbered = siblings.filter((s) => s.series_index != null)
  if (numbered.length === 0) return []
  const ownedByIndex = new Map(
    numbered.map((s) => [s.series_index, { id: s.id, status: s.status }]),
  )
  const indices = numbered.map((s) => s.series_index)
  const min = Math.min(...indices)
  const max = Math.max(...indices)

  const slots = []
  let i = min
  while (i <= max) {
    if (ownedByIndex.has(i)) {
      const { id, status } = ownedByIndex.get(i)
      slots.push({ type: 'owned', index: i, id, status })
      i += 1
      continue
    }
    let gapEnd = i
    while (gapEnd <= max && !ownedByIndex.has(gapEnd)) gapEnd += 1
    const gapLength = gapEnd - i
    if (gapLength > GAP_COLLAPSE_THRESHOLD) {
      slots.push({ type: 'ellipsis', key: `ellipsis-${i}`, from: i, to: gapEnd - 1 })
    } else {
      for (let j = i; j < gapEnd; j += 1) {
        slots.push({ type: 'gap', index: j })
      }
    }
    i = gapEnd
  }
  return slots
}

function TomeChips({ slots, currentIndex, onSelect }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current?.querySelector(`[data-tome="${currentIndex}"]`)
    el?.scrollIntoView({ behavior: 'instant', inline: 'center', block: 'nearest' })
  }, [currentIndex])

  // Molette verticale -> défilement horizontal : sans ça, la rangée n'est
  // scrollable qu'au doigt (mobile) ou en glissant la scrollbar. Sur PC
  // avec une souris classique, rien ne permettait d'atteindre les chips
  // hors champ.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onWheel(e) {
      if (e.deltaY === 0 || el.scrollWidth <= el.clientWidth) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  return (
    <div
      ref={scrollRef}
      role="group"
      aria-label="Tomes de la série"
      className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {slots.map((slot) => {
        if (slot.type === 'ellipsis') {
          return (
            <span
              key={slot.key}
              aria-hidden="true"
              title={`Tomes ${slot.from} à ${slot.to} non possédés`}
              className="shrink-0 w-6 h-6 flex items-center justify-center text-xs text-ink/70"
            >
              ···
            </span>
          )
        }
        if (slot.type === 'gap') {
          return (
            <span
              key={`gap-${slot.index}`}
              title={`Tome ${slot.index} non possédé`}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-dashed border-ink/20 text-[10px] font-mono text-ink/70"
            >
              {slot.index}
            </span>
          )
        }
        const active = slot.index === currentIndex
        return (
          <button
            key={slot.id}
            type="button"
            data-tome={slot.index}
            disabled={active}
            onClick={() => onSelect(slot)}
            aria-current={active ? 'true' : undefined}
            title={`Tome ${slot.index} (${STATUS_LABELS[slot.status] ?? slot.status})`}
            className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:cursor-default ${
              active
                ? `${STATUS_BADGE_CLASS[slot.status] ?? 'bg-ink/70 text-white'} border-transparent`
                : `${STATUS_BORDER_CLASS[slot.status] ?? 'border-ink/40'} text-ink/70 hover:bg-ink/5`
            }`}
          >
            {slot.index}
          </button>
        )
      })}
    </div>
  )
}

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

  // Même critère que l'onglet « À compléter » de la collection et le
  // formulaire d'édition (voir Collection.jsx / BookForm.jsx) : les champs
  // qu'un scan ISBN réussi remplit normalement tout seul.
  const missingFields = book
    ? [
        !book.cover_url && 'Couverture',
        !book.author && 'Auteur',
        !book.publisher && 'Éditeur',
        !book.page_count && 'Pages',
        !book.description && 'Résumé',
      ].filter(Boolean)
    : []

  const visibleSiblings = book?.series ? seriesSiblings : []
  const tomeSlots = buildTomeSlots(visibleSiblings)
  // Sans series_index sur au moins un tome, l'ordre des siblings est
  // arbitraire (celui de la base) : naviguer "précédent/suivant" dedans
  // serait aussi trompeur que l'ancienne fraction "12/17", donc on
  // désactive la navigation plutôt que de laisser croire à un ordre réel.
  const hasOrder = tomeSlots.length > 0
  const siblingIndex = visibleSiblings.findIndex((s) => s.id === id)
  const prevSibling =
    hasOrder && siblingIndex > 0 ? visibleSiblings[siblingIndex - 1] : null
  const nextSibling =
    hasOrder && siblingIndex >= 0 && siblingIndex < visibleSiblings.length - 1
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

  function handleChipSelect(slot) {
    const direction = slot.index < book.series_index ? 'back' : 'forward'
    goToSibling({ id: slot.id }, direction)
  }

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

  // Un manga/comics a quasi toujours le même titre que sa série (juste le
  // tome qui change) : la série + le tome priment sur le titre pour ces
  // types, comme sur la carte de la collection (BookCardVisual.jsx).
  const isSeriesVolume = SERIES_DRIVEN_TYPES.includes(book.type) && book.series

  // Les éditions "spéciale" (Collector, Illustrée...) sortent du lot des
  // badges texte pour un ruban doré bien visible ; le reste (Format,
  // Reliure) garde le traitement badge habituel.
  const specialEditions = sortEditions(
    (book.edition ?? []).filter((e) => SPECIAL_EDITION_TYPES.includes(e)),
  )
  const otherEditions = sortEditions(
    (book.edition ?? []).filter((e) => !SPECIAL_EDITION_TYPES.includes(e)),
  )

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ← Retour à la collection
          </button>
          {book.user_id === user?.id ? (
            <button
              type="button"
              onClick={() => navigate(`/books/${id}/edit`)}
              className="shrink-0 rounded-sm bg-library-fill text-white font-medium px-4 py-2 text-sm hover:bg-library-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
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
            <p className="absolute top-3 right-4 font-mono text-[10px] text-ink/70">
              Ajouté le {formatDate(book.created_at.slice(0, 10))}
            </p>
          )}

          {specialEditions.length > 0 && (
            <SpecialEditionRibbon label={specialEditions.join(' · ')} />
          )}

          {missingFields.length > 0 && book.user_id === user?.id && (
            <button
              type="button"
              onClick={() => navigate(`/books/${id}/edit`)}
              className="block w-full text-left rounded-sm border border-dashed border-brass/50 bg-brass/5 px-3 py-2 text-sm text-ink/70 hover:border-brass hover:bg-brass/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              <span className="font-medium text-brass">
                {missingFields.length} champ{missingFields.length > 1 ? 's' : ''} à
                compléter :
              </span>{' '}
              {missingFields.join(', ')}
            </button>
          )}

          <div className="relative flex gap-6 flex-col sm:flex-row mt-3">
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
                <BookCoverPlaceholder
                  title={book.title}
                  author={book.author}
                  volume={isSeriesVolume ? book.series_index : null}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isSeriesVolume ? (
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
                    <p className="text-sm text-brass mt-0.5">{book.series}</p>
                  )}
                </>
              )}
              {visibleSiblings.length > 1 && (
                <div className="flex items-center gap-2 mt-1 max-w-full">
                  {hasOrder ? (
                    <>
                      <button
                        type="button"
                        onClick={() => goToSibling(prevSibling, 'back')}
                        disabled={!prevSibling}
                        aria-label="Tome précédent"
                        className="shrink-0 text-sm text-library hover:text-library/80 disabled:text-ink/20 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                      >
                        ‹
                      </button>
                      <TomeChips
                        slots={tomeSlots}
                        currentIndex={book.series_index}
                        onSelect={handleChipSelect}
                      />
                      <button
                        type="button"
                        onClick={() => goToSibling(nextSibling, 'forward')}
                        disabled={!nextSibling}
                        aria-label="Tome suivant"
                        className="shrink-0 text-sm text-library hover:text-library/80 disabled:text-ink/20 disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                      >
                        ›
                      </button>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-ink/70">
                      {visibleSiblings.length} tomes possédés
                    </span>
                  )}
                </div>
              )}
              <p className={`text-ink/70 mt-1 ${book.author ? '' : 'italic'}`}>
                {book.author || 'Auteur non renseigné'}
              </p>
              {(book.translator || book.illustrator) && (
                <p className="text-xs text-ink/70 mt-0.5">
                  {book.translator && `Traduit par ${book.translator}`}
                  {book.translator && book.illustrator && ' · '}
                  {book.illustrator && `Illustré par ${book.illustrator}`}
                </p>
              )}
              <p className="text-sm text-ink/70 mt-0.5">
                <span className={book.publisher ? '' : 'italic'}>
                  {book.publisher || 'Éditeur non renseigné'}
                </span>
                {book.collection && ` · ${book.collection}`}
              </p>
              {otherEditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {otherEditions.map((e) => (
                    <span
                      key={e}
                      className="text-xs px-2 py-0.5 rounded-full border border-brass/40 text-brass"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {book.user_id === user?.id ? (
                  <select
                    value={book.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={statusSaving}
                    aria-label="Changer le statut"
                    className={`font-mono text-xs uppercase rounded-full px-2 py-0.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-library disabled:opacity-60 ${STATUS_BADGE_CLASS[book.status] ?? 'bg-ink/10 text-ink/70'}`}
                  >
                    <option value="wishlist">Wishlist</option>
                    <option value="to-read">À lire</option>
                    <option value="reading">En cours</option>
                    <option value="read">Lu</option>
                  </select>
                ) : (
                  <span
                    className={`font-mono text-xs uppercase rounded-full px-2 py-0.5 ${STATUS_BADGE_CLASS[book.status] ?? 'bg-ink/10 text-ink/70'}`}
                  >
                    {STATUS_LABELS[book.status] ?? book.status}
                  </span>
                )}
                {book.type !== 'book' && (
                  <span className="font-mono text-xs uppercase text-ink/70 border border-ink/20 rounded-full px-2 py-0.5">
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
                      className="bg-library-fill text-white text-xs px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {book.universe && (
              <span
                className="absolute bottom-0 right-0 bg-ink text-paper font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-sm"
                aria-label={`Univers : ${book.universe}`}
              >
                {book.universe}
              </span>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-ink/10">
            <h2 className="font-serif text-lg mb-2">Résumé</h2>
            <p
              className={`text-sm text-ink/70 whitespace-pre-line ${book.description ? '' : 'italic'}`}
            >
              {book.description || 'Résumé non renseigné.'}
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-ink/10 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <DetailField
              label="ISBN"
              value={book.isbn}
              mono
              placeholder="Non renseigné"
            />
            <DetailField
              label="Pages"
              value={book.page_count}
              mono
              placeholder="Non renseigné"
            />
            <DetailField
              label="Date de début"
              value={formatDate(book.date_started)}
              placeholder="Non renseigné"
            />
            <DetailField
              label="Date de fin"
              value={formatDate(book.date_finished)}
              placeholder="Non renseigné"
            />
            <DetailField
              label="Date d'achat"
              value={formatDate(book.purchase_date)}
              placeholder="Non renseigné"
            />
            <DetailField
              label="Prix"
              value={book.price != null ? `${Number(book.price).toFixed(2)} €` : null}
              mono
              placeholder="Non renseigné"
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

function DetailField({ label, value, mono, placeholder }) {
  const isEmpty = value === null || value === undefined || value === ''
  if (isEmpty && !placeholder) return null
  return (
    <div>
      <p className="text-xs text-ink/70">{label}</p>
      <p
        className={`text-sm ${isEmpty ? 'italic' : mono ? 'font-mono' : ''}`}
      >
        {isEmpty ? placeholder : value}
      </p>
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
