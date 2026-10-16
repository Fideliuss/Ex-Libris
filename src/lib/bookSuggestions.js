import { sortedUnique } from './text'

// Valeurs distinctes déjà utilisées dans les livres donnés, pour alimenter
// les suggestions de saisie du formulaire (TagInput, SuggestInput).
export function bookSuggestions(books) {
  const arrays = { tags: [], authors: [], translators: [], illustrators: [] }
  const singles = { collections: [], publishers: [], series: [], universes: [] }

  for (const book of books) {
    arrays.tags.push(...(book.tags ?? []))
    arrays.authors.push(...(book.author ?? []))
    arrays.translators.push(...(book.translator ?? []))
    arrays.illustrators.push(...(book.illustrator ?? []))
    if (book.collection) singles.collections.push(book.collection)
    if (book.publisher) singles.publishers.push(book.publisher)
    if (book.series) singles.series.push(book.series)
    if (book.universe) singles.universes.push(book.universe)
  }

  return Object.fromEntries(
    Object.entries({ ...arrays, ...singles }).map(([key, values]) => [key, sortedUnique(values)]),
  )
}
