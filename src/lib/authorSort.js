// "author" est un tableau de noms au format "Prénom Nom" chacun (toutes les
// sources de lookup ISBN sont normalisées ainsi) : plusieurs auteurs sont
// des entrées séparées, pas une chaîne à découper. On trie par nom de
// famille du premier auteur listé plutôt que prénom : c'est ce dont les
// gens se souviennent le plus souvent d'un auteur. Simple heuristique
// (dernier mot du nom) plutôt qu'un vrai parsing de nom — suffisant pour la
// grande majorité des cas.
export function authorSortKey(author) {
  const firstAuthor = author?.[0]?.trim()
  if (!firstAuthor) return ''
  const words = firstAuthor.split(/\s+/)
  // Les noms d'auteur viennent de 3 sources ISBN différentes (Google Books,
  // OpenLibrary, BNF) qui n'encodent pas forcément les lettres accentuées de
  // la même façon (forme composée "é" vs décomposée "e" + accent séparé) :
  // visuellement identiques, ces deux formes sont des chaînes différentes.
  // Sans normalisation, deux auteurs affichés pareil (ex. "Éluard") peuvent
  // finir dans des groupes distincts lors du tri par auteur.
  return (words[words.length - 1] ?? '').normalize('NFC')
}
