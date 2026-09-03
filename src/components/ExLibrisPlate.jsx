import { ACHIEVEMENT_ICONS, TIER_METAL, LOCKED_METAL } from '../lib/achievementVisuals'

// Rendu pur d'une plaque ex-libris : toute la logique (paliers, ce qui a
// été "réclamé", dates) est calculée en amont par AchievementsGallery, qui
// fournit un view-model déjà résolu — ce composant ne fait que l'afficher.
export default function ExLibrisPlate({ vm }) {
  const {
    motto,
    ownerLine,
    bigNumber,
    tierText,
    subLabel,
    dateText,
    progressText,
    icon,
    tierRank,
    locked,
    promotable,
    everRevealed,
    description,
    onClick,
  } = vm

  const tier = TIER_METAL[tierRank] ?? TIER_METAL[0]
  const clickable = promotable
  const showFullOverlay = promotable && !everRevealed
  const showCornerRibbon = promotable && everRevealed
  const ink = locked ? LOCKED_METAL.ink : tier.ink

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      title={description}
      className={`relative flex flex-col items-center justify-center text-center w-full aspect-[2.4/1] rounded-sm px-3 py-2 ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      } ${showFullOverlay ? 'animate-pulse' : ''}`}
      style={{
        background: locked ? LOCKED_METAL.background : tier.background,
        boxShadow: locked
          ? 'inset 1px 1px 2px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(15,10,5,0.3)'
          : 'inset 1px 1px 2px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(15,10,5,0.25), 0 1px 3px rgba(30,43,58,0.25)',
      }}
    >
      {showFullOverlay && (
        <span className="absolute inset-0 flex items-center justify-center px-3 font-mono text-[10px] uppercase tracking-wide text-ink/85 bg-card/75 rounded-sm">
          Promotion disponible — clique
        </span>
      )}
      {showCornerRibbon && (
        <span className="absolute top-1.5 right-1.5 font-mono text-[8px] uppercase tracking-wide text-white bg-library-fill px-1.5 py-0.5 rounded-full animate-pulse">
          Promotion !
        </span>
      )}

      <div className={showFullOverlay ? 'invisible' : ''}>
        {ownerLine && (
          <p
            className="font-mono text-[6.5px] uppercase tracking-[0.16em]"
            style={{ color: locked ? ink : `${ink}99` }}
          >
            {ownerLine}
          </p>
        )}
        <p
          className="font-serif italic font-semibold text-[13px] leading-tight"
          style={{ color: ink, textShadow: locked ? 'none' : `0 1px 0 ${tier.shadow}` }}
        >
          {motto}
        </p>
        {bigNumber != null && (
          <p className="font-mono font-bold text-[22px] leading-none mt-1" style={{ color: ink }}>
            {bigNumber}
          </p>
        )}
        {(tierText || subLabel) && (
          <p className="font-sans text-[9.5px] uppercase tracking-[0.07em] font-medium mt-1" style={{ color: ink }}>
            {tierText ? `${tierText} · ${subLabel}` : subLabel}
          </p>
        )}
        {progressText && (
          <p className="font-mono text-[10px] font-medium mt-1" style={{ color: ink }}>
            {progressText}
          </p>
        )}
        {dateText && (
          <p className="font-mono text-[8.5px] mt-1" style={{ color: `${ink}bb` }}>
            {dateText}
          </p>
        )}
      </div>

      {!showFullOverlay && (
        <svg
          viewBox="0 0 20 20"
          className="absolute bottom-1.5 right-1.5 w-4 h-4"
          fill={icon === 'star' ? ink : 'none'}
          stroke={icon === 'star' ? 'none' : ink}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {ACHIEVEMENT_ICONS[icon]}
        </svg>
      )}
    </button>
  )
}
