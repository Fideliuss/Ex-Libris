import { STATUS_BADGE_CLASS, STATUS_LABELS } from '../lib/statusLabels'
import { BOOK_TYPES, SERIES_DRIVEN_TYPES } from '../lib/bookTypes'
import WishlistRibbon from './WishlistRibbon'
import ReadingBookmark from './ReadingBookmark'
import BookCoverPlaceholder from './BookCoverPlaceholder'

// Rendu visuel pur d'une carte livre (couverture, titre/série, auteur,
// éditeur, tags, statut/note) : partagé entre BookCard (carte interactive
// de la collection) et l'aperçu live du formulaire d'ajout/édition, pour
// que l'aperçu montre vraiment la carte finale plutôt qu'une
// reconstruction approximative qui pourrait diverger avec le temps.
export default function BookCardVisual({ book }) {
  // Un manga/comics a quasi toujours le même titre que sa série (juste le
  // tome qui change) : afficher les deux répète la même chose deux fois. On
  // montre la série comme titre principal et le tome bien en évidence à la
  // place.
  const isSeriesVolume = SERIES_DRIVEN_TYPES.includes(book.type) && book.series

  return (
    <>
      {book.status === 'read' && (
        <span className="absolute top-3 right-3 -rotate-6 border-2 border-library text-library font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-card/90 pointer-events-none z-10">
          Lu
        </span>
      )}

      {book.status === 'wishlist' && <WishlistRibbon />}

      {book.status === 'reading' && <ReadingBookmark />}

      <div className="relative aspect-[2/3] bg-paper flex items-center justify-center overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <BookCoverPlaceholder
            title={book.title}
            author={book.author}
            volume={isSeriesVolume ? book.series_index : null}
          />
        )}
        {book.type !== 'book' && (
          <span className="absolute bottom-2 left-2 bg-library-fill text-white font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm">
            {BOOK_TYPES[book.type]}
          </span>
        )}
      </div>

      <div className="p-3">
        {isSeriesVolume ? (
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
          <p className="text-sm text-ink/70 mt-0.5 truncate">{book.author}</p>
        )}
        {book.publisher && (
          <p className="text-xs text-ink/70 mt-0.5 truncate">
            {book.publisher}
            {book.collection && ` · ${book.collection}`}
          </p>
        )}

        {book.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
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

        <div className="flex items-center justify-between mt-2 min-h-[1.25rem]">
          {book.status !== 'read' && book.status !== 'wishlist' && (
            <span
              className={`font-mono text-[10px] uppercase rounded-full px-2 py-0.5 ${STATUS_BADGE_CLASS[book.status]}`}
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
}
