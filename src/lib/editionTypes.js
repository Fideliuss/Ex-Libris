// Liste fermée volontairement courte : les types d'édition les plus
// courants en bibliothèque personnelle, regroupés par nature plutôt qu'en
// vrac. Les cas non couverts passent par la case "Autre" (texte libre)
// plutôt que d'allonger cette liste indéfiniment.
export const EDITION_GROUPS = [
  {
    label: 'Format',
    types: ['Poche', 'Grand format', 'Reliée', 'Numérique'],
  },
  {
    label: 'Édition spéciale',
    types: [
      'Illustrée',
      'Collector',
      'Édition limitée',
      'Édition originale',
      'Intégrale',
    ],
  },
]

export const EDITION_TYPES = EDITION_GROUPS.flatMap((group) => group.types)
