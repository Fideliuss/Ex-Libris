import { useEffect } from 'react'
import { ACHIEVEMENT_ICONS, TIER_METAL } from '../lib/achievementVisuals'
import { primaryButtonClass } from '../lib/ui'

// Révélation d'un succès ex-libris fraîchement obtenu (première fois, ou
// promotion vers un palier supérieur) : modal centrale, plaque en grand
// avec une entrée en "pop" + flash, façon révélation d'évolution.
export default function PromotionModal({ vm, onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const { motto, ownerLine, headline, bigNumber, subLabel, icon, tierRank, dateText } = vm
  const tier = TIER_METAL[tierRank] ?? TIER_METAL[0]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Succès débloqué"
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
          <span
            className="promote-flash absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${tier.shadow} 0%, transparent 70%)` }}
            aria-hidden="true"
          />
          <div
            className="promote-plate relative w-full h-full rounded-sm px-4 py-3 flex flex-col items-center justify-center text-center"
            style={{
              background: tier.background,
              boxShadow:
                'inset 1px 1px 3px rgba(255,255,255,0.4), inset -2px -2px 5px rgba(15,10,5,0.3), 0 8px 20px rgba(0,0,0,0.35)',
            }}
          >
            {ownerLine && (
              <p className="font-mono text-[8px] uppercase tracking-[0.16em]" style={{ color: `${tier.ink}99` }}>
                {ownerLine}
              </p>
            )}
            <p
              className="font-serif italic font-semibold text-base leading-tight mt-1"
              style={{ color: tier.ink, textShadow: `0 1px 0 ${tier.shadow}` }}
            >
              {motto}
            </p>
            {bigNumber != null && (
              <p className="font-mono font-bold text-3xl leading-none mt-1" style={{ color: tier.ink }}>
                {bigNumber}
              </p>
            )}
            <p className="font-sans text-[11px] uppercase tracking-[0.08em] font-medium mt-1" style={{ color: tier.ink }}>
              {subLabel}
            </p>
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
          </div>
        </div>

        {dateText && <p className="text-xs text-paper/70 mb-4">{dateText}</p>}

        <button
          type="button"
          onClick={onClose}
          className={`rounded-sm px-6 py-2 text-sm ${primaryButtonClass}`}
        >
          Continuer
        </button>
      </div>
    </div>
  )
}
