// Prédicat de filtrage partagé par Collection.jsx : vrai si `book` respecte
// tous les champs actifs de `filters`, sauf celui nommé par `exclude` (ou
// aucun si `exclude` est null/omis). Sert à la fois à calculer la liste
// réellement affichée (exclude = null) et les options proposées par chaque
// filtre, réduites par tous les AUTRES filtres déjà posés (EXL D.1) —
// sélectionner Type = Manga ne laisse plus apparaître, dans la liste
// Auteur, que les auteurs ayant au moins un manga. Sans `exclude`, cocher
// une valeur dans un filtre la ferait disparaître de sa propre liste.
export function bookMatchesFilters(book, filters, exclude = null) {
  const {
    search = '',
    selectedTags = [],
    publisher = '',
    author = '',
    collection = '',
    edition = '',
    series = '',
    universe = '',
    type = '',
    status = '',
  } = filters

  if (exclude !== 'search') {
    const query = search.trim().toLowerCase()
    if (query) {
      const isbn = (book.isbn ?? '').replace(/[\s-]/g, '')
      const haystack = `${book.title} ${(book.author ?? []).join(' ')} ${isbn}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
  }
  if (
    exclude !== 'tags' &&
    selectedTags.length > 0 &&
    !selectedTags.some((t) => book.tags?.includes(t))
  )
    return false
  if (exclude !== 'publisher' && publisher && book.publisher !== publisher) return false
  if (exclude !== 'author' && author && !book.author?.includes(author)) return false
  if (exclude !== 'collection' && collection && book.collection !== collection) return false
  if (exclude !== 'edition' && edition && !book.edition?.includes(edition)) return false
  if (exclude !== 'series' && series && book.series !== series) return false
  if (exclude !== 'universe' && universe && book.universe !== universe) return false
  if (exclude !== 'type' && type && book.type !== type) return false
  if (exclude !== 'status' && status && book.status !== status) return false
  return true
}
