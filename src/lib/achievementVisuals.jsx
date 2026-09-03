// Rendu partagé entre ExLibrisPlate (grille) et PromotionModal (révélation
// au clic) : icônes trait par catégorie, et le ton de métal + couleur de
// gravure par palier (0 Bronze -> 3 Platine).
export const ACHIEVEMENT_ICONS = {
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

export const TIER_METAL = [
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

export const LOCKED_METAL = {
  background: 'linear-gradient(160deg, #8f897c 0%, #706b5f 100%)',
  ink: 'rgba(30,25,15,0.32)',
}

export function formatUnlockedDate(value) {
  if (!value) return null
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = dateOnly
    ? new Date(...value.split('-').map((n, i) => (i === 1 ? Number(n) - 1 : Number(n))))
    : new Date(value)
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}
