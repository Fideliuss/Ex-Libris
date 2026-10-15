const PILL_BASE =
  'rounded-full px-4 py-1.5 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-library'
const PILL_ACTIVE = 'bg-library-fill text-white'
const PILL_IDLE = 'border border-ink/20 text-ink/70 hover:border-library hover:text-library'

const UNDERLINE_BASE =
  'flex items-center gap-1.5 text-sm pb-2 border-b-2 -mb-px focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-t-sm'
const UNDERLINE_ACTIVE = 'border-library text-library font-medium'
const UNDERLINE_IDLE = 'border-transparent text-ink/70'

// Barre d'onglets. `tabs` : [{ key, label, title?, badge? }]. Deux styles :
// 'pills' (pastilles, par défaut) et 'underline' (soulignement, pour les
// panneaux internes). `badge` affiche un compteur à côté du libellé.
export default function TabBar({ tabs, active, onChange, ariaLabel, variant = 'pills' }) {
  const underline = variant === 'underline'
  return (
    <div
      className={
        underline
          ? 'flex gap-4 border-b border-ink/20 mb-4'
          : 'flex flex-wrap gap-2 mb-6'
      }
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key
        const className = underline
          ? `${UNDERLINE_BASE} ${isActive ? UNDERLINE_ACTIVE : UNDERLINE_IDLE}`
          : `${PILL_BASE} ${isActive ? PILL_ACTIVE : PILL_IDLE}`
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={tab.title}
            onClick={() => onChange(tab.key)}
            className={className}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-stamp-fill text-white rounded-full text-[10px] leading-none px-1.5 py-0.5">
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
