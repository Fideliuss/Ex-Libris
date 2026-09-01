// Liste fermée volontairement courte : les types d'édition les plus
// courants en bibliothèque personnelle, regroupés par nature plutôt qu'en
// vrac. Les cas non couverts passent par la case "Autre" (texte libre)
// plutôt que d'allonger cette liste indéfiniment.
export const EDITION_GROUPS = [
  {
    label: 'Format',
    // Exclusif : un livre n'a physiquement qu'une seule taille/support à la
    // fois. Indépendant de la reliure ci-dessous : un poche relié existe
    // (ex: les Collector J'ai Lu), donc ce n'est pas le même axe.
    exclusive: true,
    types: ['Poche', 'Grand format', 'Numérique'],
  },
  {
    label: 'Reliure',
    exclusive: true,
    types: ['Broché', 'Relié'],
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

const SPECIAL_EDITION_TYPES = EDITION_GROUPS.find(
  (group) => group.label === 'Édition spéciale',
).types

// Un livre "édition spéciale" (Illustrée, Collector, Édition limitée,
// Édition originale, Intégrale) mérite un traitement visuel à part sur la
// carte, façon vraie carte de collection.
export function hasSpecialEdition(edition) {
  return (edition ?? []).some((e) => SPECIAL_EDITION_TYPES.includes(e))
}

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
