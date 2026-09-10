export const inputClass =
  'w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

// Comme inputClass, sans le style de placeholder : pour les <select>, qui
// n'en ont pas.
export const selectClass =
  'w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

// Couleur + interaction uniquement (pas de padding/taille/forme, qui varient
// légitimement d'un bouton à l'autre) : à combiner avec les utilitaires de
// mise en forme propres à chaque emplacement, ex.
// `${primaryButtonClass} rounded-sm px-4 py-2 text-sm`.
export const primaryButtonClass =
  'bg-library-fill text-white font-medium hover:bg-library-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60'

export const secondaryButtonClass =
  'border border-ink/20 text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60'

export const dangerButtonClass =
  'bg-stamp-fill text-white hover:bg-stamp-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60'

export const dangerOutlineButtonClass =
  'border border-stamp/40 text-stamp hover:bg-stamp-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60'

// Étiquette de section/champ (petites capitales espacées) : Collection,
// BookDetail, Stats, Account...
export const labelClass = 'font-mono text-xs uppercase tracking-widest text-ink/70'
