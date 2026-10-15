// Un seul collator partagé : `a.localeCompare(b, 'fr')` en recrée la
// configuration à chaque appel, ce qui coûte cher dans un comparateur de tri
// appelé O(n log n) fois.
export const frCollator = new Intl.Collator('fr')

export function compareFr(a, b) {
  return frCollator.compare(a, b)
}

// Valeurs distinctes, triées alphabétiquement (accents ignorés au premier
// niveau, comme un classement de bibliothèque).
export function sortedUnique(values) {
  return [...new Set(values)].sort(compareFr)
}
