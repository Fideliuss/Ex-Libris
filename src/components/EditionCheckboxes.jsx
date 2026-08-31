import { EDITION_TYPES } from '../lib/editionTypes'

const checkboxClass =
  'rounded-sm border-ink/30 text-library-fill focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

// Liste fermée (EDITION_TYPES) + une case "Autre" à texte libre pour les cas
// non prévus : un livre peut cumuler plusieurs éditions (ex: "Illustrée" +
// "Collector"), d'où des cases à cocher plutôt qu'un choix unique.
export default function EditionCheckboxes({ value = [], onChange }) {
  const customValue = value.find((v) => !EDITION_TYPES.includes(v)) ?? ''
  const hasCustom = value.some((v) => !EDITION_TYPES.includes(v))

  function toggle(type) {
    onChange(
      value.includes(type) ? value.filter((v) => v !== type) : [...value, type],
    )
  }

  function toggleCustom() {
    if (hasCustom) {
      onChange(value.filter((v) => EDITION_TYPES.includes(v)))
    } else {
      onChange([...value, ''])
    }
  }

  function setCustomText(text) {
    const fixed = value.filter((v) => EDITION_TYPES.includes(v))
    onChange(text ? [...fixed, text] : [...fixed, ''])
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {EDITION_TYPES.map((type) => (
          <label key={type} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.includes(type)}
              onChange={() => toggle(type)}
              className={checkboxClass}
            />
            {type}
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm shrink-0">
          <input
            type="checkbox"
            checked={hasCustom}
            onChange={toggleCustom}
            className={checkboxClass}
          />
          Autre
        </label>
        {hasCustom && (
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Préciser…"
            className="flex-1 rounded-sm border border-ink/20 bg-surface px-2 py-1 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
          />
        )}
      </div>
    </div>
  )
}
