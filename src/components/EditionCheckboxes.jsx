import { BINDING_TYPES, EDITION_GROUPS, EDITION_TYPES } from '../lib/editionTypes'
import { labelClass } from '../lib/ui'

const chipClass =
  'px-2.5 py-1 text-xs rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-library'
const chipActiveClass = 'bg-library-fill text-white border-library'
const chipInactiveClass =
  'border-ink/20 text-ink/70 hover:border-library hover:text-library'

// Groupe exclusif (Format, Reliure) : un livre n'a physiquement qu'une seule
// valeur à la fois sur cet axe, donc un sélecteur segmenté (pastilles
// collées, un seul choix visible en surbrillance) plutôt que des cases à
// cocher indépendantes qui ne montrent pas cette exclusivité avant d'en
// cocher deux.
function SegmentedGroup({ group, value, onToggle }) {
  return (
    <div>
      <p className={`${labelClass} mb-1.5`}>{group.label}</p>
      <div className="inline-flex rounded-full border border-ink/20 overflow-hidden">
        {group.types.map((type, i) => {
          const active = value.includes(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => onToggle(type)}
              aria-pressed={active}
              className={`px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-library focus-visible:ring-inset ${
                i > 0 ? 'border-l border-ink/10' : ''
              } ${active ? 'bg-library-fill text-white font-medium' : 'text-ink/70 hover:bg-paper'}`}
            >
              {type}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Liste fermée (EDITION_TYPES) + une case "Autre" à texte libre pour les cas
// non prévus : un livre peut cumuler plusieurs éditions (ex: "Illustrée" +
// "Collector"), d'où des chips multi-sélection plutôt qu'un choix unique.
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
    let withoutGroup = group?.exclusive
      ? value.filter((v) => !group.types.includes(v))
      : value
    // Numérique n'a pas de reliure physique : la sélectionner retire toute
    // reliure déjà cochée, plutôt que de laisser une combinaison
    // impossible (ex: Numérique + Relié).
    if (type === 'Numérique') {
      withoutGroup = withoutGroup.filter((v) => !BINDING_TYPES.includes(v))
    }
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
    <div className="space-y-4">
      {EDITION_GROUPS.map((group) =>
        group.exclusive ? (
          <SegmentedGroup key={group.label} group={group} value={value} onToggle={toggle} />
        ) : (
          <div key={group.label}>
            <p className={`${labelClass} mb-1.5`}>{group.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.types.map((type) => {
                const active = value.includes(type)
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggle(type)}
                    aria-pressed={active}
                    className={`${chipClass} ${active ? chipActiveClass : chipInactiveClass}`}
                  >
                    {type}
                  </button>
                )
              })}
            </div>
          </div>
        ),
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleCustom}
          aria-pressed={hasCustom}
          className={`${chipClass} shrink-0 ${
            hasCustom ? chipActiveClass : 'border-dashed border-ink/30 text-ink/70 hover:border-library hover:text-library'
          }`}
        >
          + Autre
        </button>
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
