import { useState } from 'react'
import { linkButtonClass } from '../../lib/ui'

const PAGE_SIZE = 6

// Les listes Par tag/éditeur/collection/série peuvent compter des dizaines
// d'entrées : on les pagine plutôt que de dérouler un mur de texte.
export default function PaginatedList({ items, children }) {
  const [page, setPage] = useState(0)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const clampedPage = Math.min(page, pageCount - 1)
  const visible = items.slice(
    clampedPage * PAGE_SIZE,
    clampedPage * PAGE_SIZE + PAGE_SIZE,
  )

  return (
    <>
      <ul className="space-y-3">{visible.map(children)}</ul>
      {pageCount > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className={`${linkButtonClass} disabled:opacity-30 disabled:no-underline`}
          >
            ← Précédent
          </button>
          <span className="text-xs text-ink/70 font-mono">
            {clampedPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={clampedPage === pageCount - 1}
            className={`${linkButtonClass} disabled:opacity-30 disabled:no-underline`}
          >
            Suivant →
          </button>
        </div>
      )}
    </>
  )
}
