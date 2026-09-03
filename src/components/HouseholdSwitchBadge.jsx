import { useEffect, useRef, useState } from 'react'
import { secondaryButtonClass } from '../lib/ui'

// Bascule "Ma bibliothèque / celle de l'autre" en un seul badge déroulant,
// plutôt que deux pastilles côte à côte — pensé pour la place réduite de
// l'en-tête (voir HouseholdTabs pour la version deux-pastilles pleine
// largeur utilisée en haut de la page Stats).
export default function HouseholdSwitchBadge({
  isMine,
  onSelectMine,
  onSelectPartner,
  partnerLabel,
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const currentLabel = isMine ? 'Mon Ex Libris' : `Ex Libris de ${partnerLabel}`

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${secondaryButtonClass}`}
      >
        {currentLabel}
        <span aria-hidden="true" className="text-xs">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 w-52 rounded-sm border border-ink/10 bg-card shadow-sm py-1 z-30"
        >
          <button
            type="button"
            role="option"
            aria-selected={isMine}
            onClick={() => {
              onSelectMine()
              setOpen(false)
            }}
            className={`block w-full text-left px-3 py-2 text-sm focus:outline-none focus-visible:bg-paper ${
              isMine ? 'text-library font-medium' : 'text-ink/70 hover:bg-paper hover:text-ink'
            }`}
          >
            Mon Ex Libris
          </button>
          <button
            type="button"
            role="option"
            aria-selected={!isMine}
            onClick={() => {
              onSelectPartner()
              setOpen(false)
            }}
            className={`block w-full text-left px-3 py-2 text-sm focus:outline-none focus-visible:bg-paper ${
              !isMine ? 'text-library font-medium' : 'text-ink/70 hover:bg-paper hover:text-ink'
            }`}
          >
            Ex Libris de {partnerLabel}
          </button>
        </div>
      )}
    </div>
  )
}
