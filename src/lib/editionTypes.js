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

// Un livre coche ses éditions dans l'ordre où l'utilisateur clique, pas dans
// l'ordre des groupes : on retrie systématiquement (Format avant Édition
// spéciale) avant affichage. Les valeurs "Autre" (hors liste) passent en
// dernier.
export function sortEditions(values) {
  return [...values].sort((a, b) => {
    const ai = EDITION_TYPES.indexOf(a)
    const bi = EDITION_TYPES.indexOf(b)
    return (ai === -1 ? EDITION_TYPES.length : ai) -
      (bi === -1 ? EDITION_TYPES.length : bi)
  })
}
