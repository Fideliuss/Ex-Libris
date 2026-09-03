import { useRef, useState } from 'react'

let idCounter = 0

// Remplace le <datalist> natif (popup système, non stylable, incohérent
// d'un navigateur à l'autre) par un vrai combobox : liste de suggestions
// déroulante à l'apparence de l'appli, filtrée en direct, navigable au
// clavier (flèches, Entrée, Échap).
export default function SuggestInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef(null)
  const [listboxId] = useState(() => `suggest-listbox-${++idCounter}`)

  const query = (value ?? '').toLowerCase()
  const filtered = suggestions.filter((s) => s.toLowerCase().includes(query))

  function select(suggestion) {
    onChange(suggestion)
    setOpen(false)
    setHighlighted(-1)
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((i) => (i + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((i) => (i <= 0 ? filtered.length - 1 : i - 1))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      select(filtered[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  function handleBlur(e) {
    if (containerRef.current?.contains(e.relatedTarget)) return
    setOpen(false)
    setHighlighted(-1)
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <input
        role="combobox"
        aria-expanded={open && filtered.length > 0}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value ?? ''}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlighted(-1)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-sm border border-ink/10 bg-card shadow-lg py-1"
        >
          {filtered.map((s, i) => (
            <li key={s} role="option" aria-selected={i === highlighted}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => select(s)}
                className={`block w-full text-left px-3 py-1.5 text-sm focus:outline-none ${
                  i === highlighted
                    ? 'bg-library-fill text-white'
                    : 'text-ink hover:bg-paper'
                }`}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
