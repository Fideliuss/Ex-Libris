import { ACHIEVEMENT_ICONS, TIER_METAL, LOCKED_METAL } from '../lib/achievementVisuals'

// Rendu pur d'une plaque ex-libris : toute la logique (paliers, ce qui a
// été "réclamé", dates) est calculée en amont par AchievementsGallery, qui
// fournit un view-model déjà résolu — ce composant ne fait que l'afficher.
//
// Trois états visuels : verrouillé (mystère complet, "Ex Libris / En
// attente de déblocage" — on ne révèle jamais de quoi il s'agit avant
// obtention), prêt à promouvoir (prompt qui pulse, cliquable), révélé
// (devise + chiffre centrés en évidence, rang en bas à gauche, icône en bas
// à droite).
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
  const mystery = !everRevealed
  const ink = locked ? LOCKED_METAL.ink : tier.ink

  return (
    <button
      type="button"
      onClick={promotable ? onClick : undefined}
      disabled={!promotable}
      title={everRevealed ? description : undefined}
      className={`relative flex flex-col items-center justify-center text-center w-full aspect-[2.4/1] rounded-sm px-3 py-2 ${
        promotable ? 'cursor-pointer' : 'cursor-default'
      } ${promotable ? 'animate-pulse' : ''}`}
      style={{
        background: locked ? LOCKED_METAL.background : tier.background,
        boxShadow: locked
          ? 'inset 1px 1px 2px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(15,10,5,0.3)'
          : 'inset 1px 1px 2px rgba(255,255,255,0.35), inset -2px -2px 4px rgba(15,10,5,0.25), 0 1px 3px rgba(30,43,58,0.25)',
      }}
    >
      {promotable && (
        <span className="absolute inset-0 flex items-center justify-center px-3 font-mono text-[10px] uppercase tracking-wide text-ink/85 bg-card/75 rounded-sm">
          Promotion disponible — clique
        </span>
      )}

      <div className={promotable ? 'invisible' : ''}>
        {ownerLine && !mystery && (
          <p
            className="font-mono text-[6.5px] uppercase tracking-[0.16em]"
            style={{ color: `${ink}99` }}
          >
            {ownerLine}
          </p>
        )}
        <p
          className="font-serif italic font-semibold text-[13px] leading-tight"
          style={{ color: ink, textShadow: mystery ? 'none' : `0 1px 0 ${tier.shadow}` }}
        >
          {mystery ? 'Ex Libris' : motto}
        </p>
        {!mystery && bigNumber != null && (
          <p className="font-mono font-bold text-[22px] leading-none mt-1" style={{ color: ink }}>
            {bigNumber}
          </p>
        )}
        <p className="font-sans text-[9.5px] uppercase tracking-[0.07em] font-medium mt-1" style={{ color: ink }}>
          {mystery ? 'En attente de déblocage' : subLabel}
        </p>
        {progressText && (
          <p className="font-mono text-[10px] font-medium mt-1" style={{ color: ink }}>
            {progressText}
          </p>
        )}
        {!mystery && dateText && (
          <p className="font-mono text-[8.5px] mt-1" style={{ color: `${ink}bb` }}>
            {dateText}
          </p>
        )}
      </div>

      {!mystery && !promotable && (
        <span
          className="absolute bottom-1.5 left-1.5 font-mono text-[7px] uppercase tracking-wide"
          style={{ color: `${ink}bb` }}
        >
          {tierText}
        </span>
      )}

      {!mystery && !promotable && (
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
