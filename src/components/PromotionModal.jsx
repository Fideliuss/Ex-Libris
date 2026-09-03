import { useEffect } from 'react'
import { ACHIEVEMENT_ICONS, TIER_METAL, LOCKED_METAL } from '../lib/achievementVisuals'
import { primaryButtonClass } from '../lib/ui'

// Modal centrale pour une plaque ex-libris, dans l'un de trois rôles :
// - promotion (`animate: true`) : révélation d'un palier fraîchement
//   atteint, entrée en "pop" + flash façon évolution ;
// - détails (`animate` absent, `mystery` absent) : consultation d'un
//   succès déjà obtenu, plaque statique + description complète ;
// - mystère (`mystery: true`) : succès pas encore débloqué, la plaque
//   garde son secret, seule la piste (progression) est montrée.
export default function PromotionModal({ vm, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const {
    motto,
    ownerLine,
    headline,
    bigNumber,
    subLabel,
    icon,
    tierRank,
    dateText,
    description,
    progressText,
    mystery,
    animate,
    actionLabel,
  } = vm
  const tier = mystery ? LOCKED_METAL : (TIER_METAL[tierRank] ?? TIER_METAL[0])
  const shadow = mystery ? 'rgba(255,255,255,0.15)' : tier.shadow

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Succès"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xs w-full flex flex-col items-center text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-paper/70 mb-4">
          {headline}
        </p>

        <div className="relative w-56 aspect-[2.4/1] mb-6">
          {animate && (
            <span
              className="promote-flash absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${shadow} 0%, transparent 70%)` }}
              aria-hidden="true"
            />
          )}
          <div
            className={`relative w-full h-full rounded-sm px-4 py-3 flex flex-col items-center justify-center text-center ${animate ? 'promote-plate' : ''}`}
            style={{
              background: tier.background,
              boxShadow:
                'inset 1px 1px 3px rgba(255,255,255,0.4), inset -2px -2px 5px rgba(15,10,5,0.3), 0 8px 20px rgba(0,0,0,0.35)',
            }}
          >
            {ownerLine && !mystery && (
              <p className="font-mono text-[8px] uppercase tracking-[0.16em]" style={{ color: `${tier.ink}99` }}>
                {ownerLine}
              </p>
            )}
            <p
              className="font-serif italic font-semibold text-base leading-tight mt-1"
              style={{ color: tier.ink, textShadow: mystery ? 'none' : `0 1px 0 ${shadow}` }}
            >
              {mystery ? 'Ex Libris' : motto}
            </p>
            {!mystery && bigNumber != null && (
              <p className="font-mono font-bold text-3xl leading-none mt-1" style={{ color: tier.ink }}>
                {bigNumber}
              </p>
            )}
            <p className="font-sans text-[11px] uppercase tracking-[0.08em] font-medium mt-1" style={{ color: tier.ink }}>
              {mystery ? 'En attente de déblocage' : subLabel}
            </p>
            {progressText && (
              <p className="font-mono text-[10px] mt-1" style={{ color: `${tier.ink}cc` }}>
                {progressText}
              </p>
            )}
            {!mystery && (
              <svg
                viewBox="0 0 20 20"
                className="absolute bottom-2 right-2 w-5 h-5"
                fill={icon === 'star' ? tier.ink : 'none'}
                stroke={icon === 'star' ? 'none' : tier.ink}
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {ACHIEVEMENT_ICONS[icon]}
              </svg>
            )}
          </div>
        </div>

        {mystery ? (
          <p className="text-xs text-paper/70 mb-4 max-w-[220px]">
            Continue ta collection pour découvrir ce succès.
          </p>
        ) : (
          <>
            {description && (
              <p className="text-xs text-paper/70 mb-2 max-w-[240px]">{description}</p>
            )}
            {dateText && <p className="text-xs text-paper/50 mb-4">{dateText}</p>}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`rounded-sm px-6 py-2 text-sm ${primaryButtonClass}`}
        >
          {actionLabel ?? 'Continuer'}
        </button>
      </div>
    </div>
  )
}
