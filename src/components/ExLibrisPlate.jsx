import { useState } from 'react'

const ICONS = {
  quill: (
    <>
      <path d="M4 16l8-8 2 2-8 8H4v-2z" />
      <path d="M12 8l2-2a2 2 0 0 1 3 3l-2 2" />
    </>
  ),
  books: (
    <>
      <rect x="3" y="13.5" width="14" height="3" rx="0.6" />
      <rect x="4" y="9.5" width="12" height="3" rx="0.6" />
      <rect x="3" y="5.5" width="10" height="3" rx="0.6" />
    </>
  ),
  shelf: (
    <>
      <path d="M3 17h14" />
      <rect x="4" y="7" width="2.4" height="9" />
      <rect x="7.5" y="5" width="2.4" height="11" />
      <rect x="11" y="8" width="2.4" height="8" />
      <rect x="14.5" y="6" width="2.4" height="10" />
    </>
  ),
  compass: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M11.6 6.4 13 10l-1.4 3.6L8.2 12 7 8.4z" />
    </>
  ),
  links: (
    <>
      <rect x="2" y="6.5" width="9" height="6" rx="3" />
      <rect x="9" y="8.5" width="9" height="6" rx="3" />
    </>
  ),
  star: <path d="M10 2.5l2.35 4.77 5.26.77-3.8 3.71.9 5.25L10 14.5l-4.7 2.5.9-5.25-3.8-3.71 5.26-.77z" />,
  circles: (
    <>
      <circle cx="7.2" cy="10" r="5.2" />
      <circle cx="12.8" cy="10" r="5.2" />
    </>
  ),
}

// Ton du métal + couleur de gravure par palier (0 Bronze -> 3 Platine). Le
// texte reste une couleur pleine (contraste) avec juste un léger reflet
// clair en dessous pour suggérer le relief gravé, plutôt que de tout miser
// sur l'ombre pour la lisibilité.
const TIER_STYLE = [
  {
    background: 'linear-gradient(160deg, #d9bd8b 0%, #ad8a54 55%, #8e7145 100%)',
    ink: '#3d2a12',
    shadow: 'rgba(255,244,222,0.55)',
  },
  {
    background: 'linear-gradient(160deg, #e6e6e3 0%, #b6b6b2 55%, #94948e 100%)',
    ink: '#33353a',
    shadow: 'rgba(255,255,255,0.6)',
  },
  {
    background: 'linear-gradient(160deg, #f0d789 0%, #d6a51a 55%, #b8860b 100%)',
    ink: '#4a3405',
    shadow: 'rgba(255,247,214,0.6)',
  },
  {
    background: 'linear-gradient(160deg, #eef1f4 0%, #c5ccd2 55%, #a7b0b8 100%)',
    ink: '#2c333a',
    shadow: 'rgba(255,255,255,0.65)',
  },
]

function claimKey(userId, badgeId) {
  return `exlibris-claimed:${userId ?? 'anon'}:${badgeId}`
}

function formatUnlockedDate(value) {
  if (!value) return null
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = dateOnly
    ? new Date(...value.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
    : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

// Plaque ex-libris horizontale, gravée dans un ton de métal qui suit le
// palier (bronze/argent/or/platine). Un succès atteint mais pas encore
// "réclamé" pulse et invite au clic ; le clic le grave définitivement (état
// mémorisé par navigateur, indépendamment par utilisateur).
export default function ExLibrisPlate({ badge, userId }) {
  const [claimed, setClaimed] = useState(() => {
    if (!badge.unlocked) return false
    try {
      return localStorage.getItem(claimKey(userId, badge.id)) === '1'
    } catch {
      return false
    }
  })

  const ready = badge.unlocked && !claimed
  const tier = TIER_STYLE[badge.tierRank] ?? TIER_STYLE[0]

  function handleClaim() {
    if (!ready) return
    try {
      localStorage.setItem(claimKey(userId, badge.id), '1')
    } catch {
      // localStorage indisponible (navigation privée...) : l'état reste en
      // mémoire pour cette session, tant pis pour la persistance.
    }
    setClaimed(true)
  }

  const locked = !badge.unlocked
  const showProgress = locked && badge.target > 1

  return (
    <button
      type="button"
      onClick={handleClaim}
      disabled={!ready}
      title={badge.description}
      className={`relative flex items-center gap-3 w-full aspect-[2.4/1] rounded-sm px-3 py-2 text-left transition-transform duration-700 ${
        ready ? 'cursor-pointer animate-pulse' : 'cursor-default'
      } ${claimed ? '[transform:rotateY(360deg)]' : ''}`}
      style={{
        background: locked
          ? 'linear-gradient(160deg, #8f897c 0%, #706b5f 100%)'
          : tier.background,
        boxShadow: locked
          ? 'inset 1px 1px 2px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(15,10,5,0.3)'
          : `inset 1px 1px 2px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(15,10,5,0.25), 0 1px 3px rgba(30,43,58,0.25)${
              ready ? `, 0 0 0 2px ${tier.shadow}` : ''
            }`,
      }}
    >
      {ready && (
        <span className="absolute inset-0 flex items-center justify-center px-3 font-mono text-[9px] uppercase tracking-wide text-ink/80 bg-card/70 rounded-sm">
          Seuil atteint — clique pour graver
        </span>
      )}

      <svg
        viewBox="0 0 20 20"
        className={`w-7 h-7 shrink-0 ${ready ? 'invisible' : ''}`}
        fill={badge.icon === 'star' ? locked ? 'rgba(30,25,15,0.25)' : tier.ink : 'none'}
        stroke={badge.icon === 'star' ? 'none' : locked ? 'rgba(30,25,15,0.25)' : tier.ink}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={
          locked
            ? undefined
            : { filter: `drop-shadow(0 1px 0 ${tier.shadow})` }
        }
        aria-hidden="true"
      >
        {ICONS[badge.icon]}
      </svg>

      <div className={`min-w-0 ${ready ? 'invisible' : ''}`}>
        <p
          className="font-serif italic font-semibold text-[13px] leading-tight truncate"
          style={
            locked
              ? { color: 'rgba(30,25,15,0.3)' }
              : { color: tier.ink, textShadow: `0 1px 0 ${tier.shadow}` }
          }
        >
          {badge.motto}
        </p>
        <p
          className="font-sans text-[8px] uppercase tracking-[0.1em] truncate"
          style={{ color: locked ? 'rgba(30,25,15,0.25)' : `${tier.ink}99` }}
        >
          {badge.translation}
        </p>
        {showProgress && (
          <p className="font-mono text-[9px] mt-0.5" style={{ color: 'rgba(30,25,15,0.3)' }}>
            {badge.current}/{badge.target}
          </p>
        )}
        {claimed && (
          <p className="font-mono text-[8px] mt-0.5" style={{ color: `${tier.ink}aa` }}>
            {formatUnlockedDate(badge.unlockedAt) ?? 'Débloqué'}
          </p>
        )}
      </div>
    </button>
  )
}
