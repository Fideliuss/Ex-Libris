import { EDITION_GROUPS, EDITION_TYPES } from '../lib/editionTypes'
import { labelClass } from '../lib/ui'

const checkboxClass =
  'rounded-sm border-ink/30 text-library-fill focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

// Liste fermée (EDITION_TYPES) + une case "Autre" à texte libre pour les cas
// non prévus : un livre peut cumuler plusieurs éditions (ex: "Illustrée" +
// "Collector"), d'où des cases à cocher plutôt qu'un choix unique.
export default function EditionCheckboxes({ value = [], onChange }) {
  const customValue = value.find((v) => !EDITION_TYPES.includes(v)) ?? ''
  const hasCustom = value.some((v) => !EDITION_TYPES.includes(v))

  function toggle(type) {
    if (value.includes(type)) {
      onChange(value.filter((v) => v !== type))
      return
    }
    // Un groupe exclusif (Format, Reliure) ne garde qu'un choix à la fois :
    // cocher "Grand format" retire "Poche" s'il était coché, plutôt que de
    // les cumuler.
    const group = EDITION_GROUPS.find((g) => g.types.includes(type))
    const withoutGroup = group?.exclusive
      ? value.filter((v) => !group.types.includes(v))
      : value
    onChange([...withoutGroup, type])
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
    <div className="space-y-3">
      {EDITION_GROUPS.map((group) => (
        <div key={group.label}>
          <p className={`${labelClass} mb-1.5`}>{group.label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {group.types.map((type) => (
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
        </div>
      ))}
      <div className="flex items-center gap-2 pt-1 border-t border-ink/10">
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
