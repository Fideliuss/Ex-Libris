import { useRef } from 'react'
import { useEdgeFade } from '../hooks/useEdgeFade'

function tabClass(active) {
  return `shrink-0 rounded-full px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
    active
      ? 'bg-library-fill text-white'
      : 'border border-ink/20 text-ink/70 hover:border-library hover:text-library'
  }`
}

// Une pastille par membre du foyer (members inclut le membre courant),
// dans une rangée défilable avec indice de fondu si elle déborde de la
// largeur visible (même motif que les onglets mobiles de Account.jsx).
export default function HouseholdTabs({ members, selectedId, onSelect, labelFor, ariaLabel }) {
  const scrollRef = useRef(null)
  const edgeFade = useEdgeFade(scrollRef)

  return (
    <div className="relative mb-6">
      <div
        ref={scrollRef}
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-2 overflow-x-auto pb-1"
      >
        {members.map((m) => (
          <button
            key={m.userId}
            type="button"
            role="tab"
            aria-selected={m.userId === selectedId}
            onClick={() => onSelect(m.userId)}
            className={tabClass(m.userId === selectedId)}
          >
            {labelFor(m)}
          </button>
        ))}
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 bottom-1 left-0 w-8 bg-gradient-to-r from-paper to-transparent transition-opacity ${edgeFade.left ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 bottom-1 right-0 w-8 bg-gradient-to-l from-paper to-transparent transition-opacity ${edgeFade.right ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
