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
  star: (
    <path d="M10 2.5l2.35 4.77 5.26.77-3.8 3.71.9 5.25L10 14.5l-4.7 2.5.9-5.25-3.8-3.71 5.26-.77z" />
  ),
  circles: (
    <>
      <circle cx="7.2" cy="10" r="5.2" />
      <circle cx="12.8" cy="10" r="5.2" />
    </>
  ),
}

// Une date-only Postgres ('YYYY-MM-DD', ex. date_finished) parsée avec
// `new Date(str)` est interprétée en UTC et peut décaler d'un jour selon le
// fuseau — on la reconstruit en local, contrairement à un timestamp complet
// (created_at) que `new Date` gère déjà correctement.
function formatUnlockedDate(value) {
  if (!value) return null
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = dateOnly
    ? new Date(...value.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
    : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

// Plaque façon ex-libris gravé : un succès verrouillé montre son cadre et sa
// devise en silhouette grisée (on sait qu'il existe, pas comment l'obtenir
// précisément) ; déverrouillé, il passe en ink/brass plein avec sa date.
export default function ExLibrisPlate({ achievement, result }) {
  const { unlocked, current, target, unlockedAt } = result
  const showProgress = !unlocked && target > 1

  return (
    <div
      title={achievement.description}
      className={`relative aspect-[3/4] bg-cover rounded-sm border p-3 flex flex-col items-center text-center ${
        unlocked ? 'border-brass/40 shadow-sm' : 'border-ink/10'
      }`}
    >
      <Corner unlocked={unlocked} className="top-1.5 left-1.5 border-t-2 border-l-2" />
      <Corner unlocked={unlocked} className="top-1.5 right-1.5 border-t-2 border-r-2" />
      <Corner unlocked={unlocked} className="bottom-1.5 left-1.5 border-b-2 border-l-2" />
      <Corner unlocked={unlocked} className="bottom-1.5 right-1.5 border-b-2 border-r-2" />

      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-2">
        <svg
          viewBox="0 0 20 20"
          className={`w-6 h-6 ${unlocked ? 'text-brass' : 'text-ink/20'}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {ICONS[achievement.icon]}
        </svg>
        <p
          className={`font-serif italic text-sm leading-snug ${
            unlocked ? 'text-ink' : 'text-ink/25'
          }`}
        >
          {achievement.motto}
        </p>
        <p
          className={`font-sans text-[9px] uppercase tracking-[0.14em] ${
            unlocked ? 'text-ink/60' : 'text-ink/25'
          }`}
        >
          {achievement.translation}
        </p>
        {showProgress && (
          <p className="font-mono text-[10px] text-ink/40">
            {current}/{target}
          </p>
        )}
      </div>

      {unlocked && (
        <p className="font-mono text-[9px] text-brass pb-1">
          {formatUnlockedDate(unlockedAt) ?? 'Débloqué'}
        </p>
      )}
    </div>
  )
}

function Corner({ unlocked, className }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute w-3 h-3 ${className} ${
        unlocked ? 'border-brass/70' : 'border-ink/15'
      }`}
    />
  )
}
