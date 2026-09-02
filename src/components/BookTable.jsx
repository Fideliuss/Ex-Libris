import { useNavigate } from 'react-router-dom'
import { STATUS_BADGE_CLASS, STATUS_LABELS } from '../lib/statusLabels'
import { SERIES_DRIVEN_TYPES } from '../lib/bookTypes'
import { navigateWithViewTransition } from '../lib/navigation'
import { labelClass } from '../lib/ui'
import BookCoverPlaceholder from './BookCoverPlaceholder'

const TAGS_VISIBLE = 2

// Rendu tabulaire de la collection (colonnes fixes, alternative dense à la
// grille de cartes) : réutilise les mêmes `items` groupés que la grille
// (voir `gridItems` dans Collection.jsx) pour ne pas dupliquer la logique
// de tri/regroupement entre les deux vues.
export default function BookTable({
  items,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onStartSelection,
  isMine,
}) {
  const navigate = useNavigate()

  function handleOpen(book, e) {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigateWithViewTransition(navigate, `/books/${book.id}`, {
      preload: () => import('../pages/BookDetail'),
    })
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-ink/10 bg-card shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="w-10 px-3 py-2" />
            <th className={`text-left px-3 py-2 ${labelClass}`}>Titre</th>
            <th className={`text-left px-3 py-2 ${labelClass}`}>Auteur</th>
            <th className={`text-left px-3 py-2 ${labelClass}`}>Statut</th>
            <th className={`text-left px-3 py-2 ${labelClass}`}>Note</th>
            <th className={`text-left px-3 py-2 ${labelClass}`}>Éditeur</th>
            <th className={`text-left px-3 py-2 ${labelClass}`}>Tags</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) =>
            item.type === 'header' ? (
              <tr key={item.renderKey}>
                <td colSpan={7} className={`px-3 pt-3 pb-1 ${labelClass}`}>
                  {item.label}
                </td>
              </tr>
            ) : (
              <BookTableRow
                key={item.renderKey}
                book={item.book}
                selectable={selectionMode}
                selected={selectedIds?.has(item.book.id)}
                onToggleSelect={onToggleSelect}
                onStartSelection={isMine ? onStartSelection : undefined}
                onOpen={handleOpen}
              />
            ),
          )}
        </tbody>
      </table>
    </div>
  )
}

function BookTableRow({
  book,
  selectable,
  selected,
  onToggleSelect,
  onStartSelection,
  onOpen,
}) {
  const isSeriesVolume = SERIES_DRIVEN_TYPES.includes(book.type) && book.series
  const tags = book.tags ?? []
  const visibleTags = tags.slice(0, TAGS_VISIBLE)
  const hiddenTagCount = tags.length - visibleTags.length

  function handleRowClick(e) {
    if (selectable) {
      onToggleSelect(book.id)
      return
    }
    onOpen(book, e)
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (selectable) onToggleSelect(book.id)
    else onOpen(book, { defaultPrevented: false, button: 0, preventDefault: () => {} })
  }

  return (
    <tr
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role={selectable ? 'button' : 'link'}
      aria-pressed={selectable ? selected : undefined}
      className="cursor-pointer border-b border-ink/5 last:border-b-0 hover:bg-paper/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-library focus-visible:ring-inset"
    >
      <td className="px-3 py-2">
        {onStartSelection && (
          <button
            type="button"
            aria-label={selected ? 'Désélectionner ce livre' : 'Sélectionner ce livre'}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (selectable) onToggleSelect(book.id)
              else onStartSelection(book.id)
            }}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
              selected
                ? 'bg-library-fill border-library text-white'
                : 'border-ink/30 text-transparent hover:border-ink/50'
            }`}
          >
            ✓
          </button>
        )}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 aspect-[2/3] shrink-0 rounded-sm overflow-hidden bg-cover">
            {book.cover_url ? (
              <img src={book.cover_url} alt="" className="w-full h-full object-contain" />
            ) : (
              <BookCoverPlaceholder
                title={book.title}
                author={book.author}
                volume={isSeriesVolume ? book.series_index : null}
              />
            )}
          </div>
          <div className="min-w-0">
            {isSeriesVolume ? (
              <>
                <p className="font-serif text-sm truncate">{book.series}</p>
                {book.series_index != null && (
                  <p className="font-mono text-xs text-brass">Tome {book.series_index}</p>
                )}
              </>
            ) : (
              <>
                <p className="font-serif text-sm truncate">{book.title}</p>
                {book.series && (
                  <p className="text-xs text-brass truncate">{book.series}</p>
                )}
              </>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-sm text-ink/70 whitespace-nowrap">
        {book.author || '—'}
      </td>
      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-ink/70 whitespace-nowrap">
          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_BADGE_CLASS[book.status]}`} />
          {STATUS_LABELS[book.status]}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-brass whitespace-nowrap">
        {book.rating > 0 ? '★'.repeat(book.rating) : '—'}
      </td>
      <td className="px-3 py-2 text-sm text-ink/70 whitespace-nowrap">
        {book.publisher || '—'}
        {book.collection && ` · ${book.collection}`}
      </td>
      <td className="px-3 py-2">
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="bg-library-fill text-white text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="text-[10px] text-ink/50">+{hiddenTagCount}</span>
            )}
          </div>
        ) : (
          <span className="text-sm text-ink/40">—</span>
        )}
      </td>
    </tr>
  )
}
