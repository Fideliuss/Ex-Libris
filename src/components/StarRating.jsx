import { useId, useState } from 'react'

// Même tracé que l'icône "star" des succès (achievementVisuals.jsx), pour
// rester visuellement cohérent dans toute l'app plutôt que d'inventer un
// second dessin d'étoile.
const STAR_PATH =
  'M10 2.5l2.35 4.77 5.26.77-3.8 3.71.9 5.25L10 14.5l-4.7 2.5.9-5.25-3.8-3.71 5.26-.77z'

const SIZE_CLASSES = { sm: 'w-4 h-4', md: 'w-6 h-6' }

// Étoile à moitié remplie : un tracé plein découpé à `fillPct` (0-20, sur
// les 20 unités du viewBox) par-dessus le même tracé en contour. Un id de
// clip-path unique par étoile (useId) : sans ça, plusieurs <StarRating>
// sur la même page partageraient le même id et se marcheraient dessus.
function Star({ fillPct, size }) {
  const clipId = useId()
  return (
    <svg viewBox="0 0 20 20" className={SIZE_CLASSES[size]} aria-hidden="true">
      <path
        d={STAR_PATH}
        className="fill-none stroke-brass"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {fillPct > 0 && (
        <>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={fillPct} height="20" />
          </clipPath>
          <path d={STAR_PATH} className="fill-brass" clipPath={`url(#${clipId})`} />
        </>
      )}
    </svg>
  )
}

// value/onChange absents (ou readOnly) -> simple affichage, non cliquable.
// Sinon, éditable avec demi-étoiles : cliquer sur la moitié gauche/droite
// d'une étoile pose n-0.5/n. e.detail === 0 (clic déclenché au clavier, pas
// à la souris) force la granularité entière — la détection par position ne
// veut rien dire sans coordonnées de pointeur.
export default function StarRating({ value = 0, onChange, readOnly = false, size = 'md' }) {
  const [hovered, setHovered] = useState(null)
  const interactive = Boolean(onChange) && !readOnly
  const display = interactive ? (hovered ?? value) : value

  function valueFromEvent(e, n) {
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeftHalf = e.clientX - rect.left < rect.width / 2
    return isLeftHalf ? n - 0.5 : n
  }

  if (!interactive) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={size}
            fillPct={Math.max(0, Math.min(20, (display - (n - 1)) * 20))}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseMove={(e) => setHovered(valueFromEvent(e, n))}
          onClick={(e) => {
            const clicked = e.detail === 0 ? n : valueFromEvent(e, n)
            onChange(value === clicked ? 0 : clicked)
          }}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <Star size={size} fillPct={Math.max(0, Math.min(20, (display - (n - 1)) * 20))} />
        </button>
      ))}
    </div>
  )
}
