import { memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { STATUS_BORDER_CLASS } from '../lib/statusLabels'
import BookCardVisual from './BookCardVisual'
import { isPlainLeftClick, navigateWithViewTransition } from '../lib/navigation'

function BookCard({
  book,
  selectable,
  selected,
  onToggleSelect,
  onStartSelection,
}) {
  const navigate = useNavigate()

  function handleOpen(e) {
    if (!isPlainLeftClick(e)) return
    e.preventDefault()
    navigateWithViewTransition(navigate, `/books/${book.id}`, {
      preload: () => import('../pages/BookDetail'),
    })
  }
  const content = (
    <>
      {selectable && (
        <span
          aria-hidden="true"
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
            selected
              ? 'bg-library-fill border-library text-white'
              : 'bg-card/90 border-ink/30 text-transparent'
          }`}
        >
          ✓
        </span>
      )}

      {!selectable && onStartSelection && (
        <button
          type="button"
          aria-label="Sélectionner ce livre"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onStartSelection(book.id)
          }}
          className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 border-ink/30 bg-card/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        />
      )}

      <BookCardVisual book={book} />
    </>
  )

  const baseClass =
    'group relative block w-full text-left bg-card border-t-4 border-dashed rounded-sm shadow-sm overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

  const statusBorderClass = STATUS_BORDER_CLASS[book.status]

  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect(book.id)}
        aria-pressed={selected}
        className={`${baseClass} hover:shadow-md transition-shadow ${
          selected ? 'border-library' : statusBorderClass
        }`}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      to={`/books/${book.id}`}
      onClick={handleOpen}
      className={`${baseClass} ${statusBorderClass} hover:shadow-md transition-shadow`}
    >
      {content}
    </Link>
  )
}

// Mémoïsé : dans une grille de centaines de cartes, un changement d'état de la
// page (sélection, scroll...) ne doit re-rendre que les cartes concernées.
export default memo(BookCard)
