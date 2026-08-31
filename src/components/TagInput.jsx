import { useState } from 'react'

export default function TagInput({ value, onChange, suggestions = [] }) {
  const [draft, setDraft] = useState('')

  const availableSuggestions = suggestions.filter(
    (tag) =>
      draft.length > 0 &&
      !value.includes(tag) &&
      tag.toLowerCase().includes(draft.toLowerCase()),
  )

  function addTag(tag) {
    const clean = tag.trim()
    if (!clean || value.includes(clean)) return
    onChange([...value, clean])
    setDraft('')
  }

  function removeTag(tag) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-library">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-library-fill text-white text-xs px-2 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-stamp focus:outline-none"
              aria-label={`Retirer le tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? 'Ajouter un tag, Entrée pour valider' : ''}
          className="flex-1 min-w-[8ch] text-sm outline-none bg-transparent py-0.5"
        />
      </div>
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {availableSuggestions.slice(0, 6).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="text-xs px-2 py-1 rounded-full border border-brass/40 text-brass hover:bg-brass-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
