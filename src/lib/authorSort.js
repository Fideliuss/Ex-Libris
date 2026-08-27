// Le champ "author" est du texte libre au format "Prénom Nom" (toutes les
// sources de lookup ISBN sont normalisées ainsi), parfois plusieurs auteurs
// séparés par une virgule. On trie par nom de famille plutôt que prénom :
// c'est ce dont les gens se souviennent le plus souvent d'un auteur. Simple
// heuristique (dernier mot du premier auteur listé) plutôt qu'un vrai
// parsing de nom — suffisant pour la grande majorité des cas.
export function authorSortKey(author) {
  if (!author) return ''
  const firstAuthor = author.split(',')[0].trim()
  const words = firstAuthor.split(/\s+/)
  return words[words.length - 1] ?? ''
}
