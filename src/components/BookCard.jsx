import { Link } from 'react-router-dom'
import {
  STATUS_BADGE_CLASS,
  STATUS_BORDER_CLASS,
  STATUS_LABELS,
} from '../lib/statusLabels'
import { BOOK_TYPES } from '../lib/bookTypes'
import WishlistRibbon from './WishlistRibbon'
import ReadingBookmark from './ReadingBookmark'

export default function BookCard({
  book,
  selectable,
  selected,
  onToggleSelect,
  onStartSelection,
}) {
  // Un manga a quasi toujours le même titre que sa série (juste le tome qui
  // change) : afficher les deux répète la même chose deux fois. On montre
  // la série comme titre principal et le tome bien en évidence à la place.
  const isMangaVolume = book.type === 'manga' && book.series

  const content = (
    <>
      {book.status === 'read' && (
        <span className="absolute top-3 right-3 -rotate-6 border-2 border-library text-library font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-card/90 pointer-events-none z-10">
          Lu
        </span>
      )}

      {book.status === 'wishlist' && <WishlistRibbon />}

      {book.status === 'reading' && <ReadingBookmark />}

      {selectable && (
        <span
          aria-hidden="true"
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
            selected
              ? 'bg-library border-library text-white'
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

      <div className="relative aspect-[2/3] bg-paper flex items-center justify-center overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-serif text-ink/30 text-sm px-4 text-center">
            {book.title}
          </span>
        )}
        {book.type !== 'book' && (
          <span className="absolute bottom-2 left-2 bg-library text-white font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm">
            {BOOK_TYPES[book.type]}
          </span>
        )}
      </div>

      <div className="p-3">
        {isMangaVolume ? (
          <>
            <p className="font-serif text-base leading-snug line-clamp-2">
              {book.series}
            </p>
            {book.series_index != null && (
              <p className="font-mono text-sm text-brass font-semibold mt-0.5">
                Tome {book.series_index}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-serif text-base leading-snug line-clamp-2">
              {book.title}
            </p>
            {book.series && (
              <p className="text-xs text-brass mt-0.5 truncate">
                {book.series}
                {book.series_index != null && ` · Tome ${book.series_index}`}
              </p>
            )}
          </>
        )}
        {book.author && (
          <p className="text-sm text-ink/60 mt-0.5 truncate">{book.author}</p>
        )}
        {book.publisher && (
          <p className="text-xs text-ink/40 mt-0.5 truncate">
            {book.publisher}
            {book.collection && ` · ${book.collection}`}
          </p>
        )}

        {book.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
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

        <div className="flex items-center justify-between mt-2 min-h-[1.25rem]">
          {book.status !== 'read' && book.status !== 'wishlist' && (
            <span
              className={`font-mono text-xs uppercase ${STATUS_BADGE_CLASS[book.status]}`}
            >
              {STATUS_LABELS[book.status]}
            </span>
          )}
          {book.rating > 0 && (
            <span className="text-brass text-sm ml-auto" aria-hidden="true">
              {'★'.repeat(book.rating)}
              {'☆'.repeat(5 - book.rating)}
            </span>
          )}
        </div>
      </div>
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
      className={`${baseClass} ${statusBorderClass} hover:shadow-md transition-shadow`}
    >
      {content}
    </Link>
  )
}
