import { useEffect, useRef, useState } from 'react'
import { secondaryButtonClass } from '../lib/ui'

function labelFor(member, currentUserId) {
  if (member.userId === currentUserId) return 'Mon Ex Libris'
  return `Ex Libris de ${member.displayName ?? member.email}`
}

// Bascule "Mon Ex Libris / celui d'un membre du foyer" en un seul badge
// déroulant, plutôt que des pastilles côte à côte — pensé pour la place
// réduite de l'en-tête (voir HouseholdTabs pour la version pleine largeur
// utilisée en haut de la page Stats). members inclut le membre courant.
export default function HouseholdSwitchBadge({ members, selectedId, onSelect, currentUserId }) {
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

  const current = members.find((m) => m.userId === selectedId)

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm ${secondaryButtonClass}`}
      >
        {current ? labelFor(current, currentUserId) : 'Mon Ex Libris'}
        <span aria-hidden="true" className="text-xs">
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-1 w-52 max-h-64 overflow-y-auto rounded-sm border border-ink/10 bg-card shadow-sm py-1 z-30"
        >
          {members.map((m) => (
            <button
              key={m.userId}
              type="button"
              role="option"
              aria-selected={m.userId === selectedId}
              onClick={() => {
                onSelect(m.userId)
                setOpen(false)
              }}
              className={`block w-full text-left px-3 py-2 text-sm focus:outline-none focus-visible:bg-paper ${
                m.userId === selectedId ? 'text-library font-medium' : 'text-ink/70 hover:bg-paper hover:text-ink'
              }`}
            >
              {labelFor(m, currentUserId)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
