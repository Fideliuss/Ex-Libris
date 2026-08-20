import { Link } from 'react-router-dom'

const statusLabel = {
  wishlist: 'Souhaité',
  'to-read': 'À lire',
  reading: 'En cours',
}

export default function BookCard({ book }) {
  return (
    <Link
      to={`/books/${book.id}/edit`}
      className="group relative block bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm hover:shadow-md transition-shadow overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
    >
      {book.status === 'read' && (
        <span className="absolute top-3 right-3 -rotate-6 border-2 border-stamp text-stamp font-mono text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-card/90 pointer-events-none">
          Lu
        </span>
      )}

      <div className="aspect-[2/3] bg-paper flex items-center justify-center overflow-hidden">
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
      </div>

      <div className="p-3">
        <p className="font-serif text-base leading-snug line-clamp-2">
          {book.title}
        </p>
        {book.author && (
          <p className="text-sm text-ink/60 mt-0.5 truncate">{book.author}</p>
        )}
        {book.publisher && (
          <p className="text-xs text-ink/40 mt-0.5 truncate">
            {book.publisher}
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
          {book.status !== 'read' && (
            <span className="font-mono text-xs text-ink/50 uppercase">
              {statusLabel[book.status]}
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
    </Link>
  )
}
