// Règles pures du cache de livres (voir LibraryDataProvider), isolées du
// composant pour pouvoir les tester sans rendu React.

// Au-delà de cet âge, le cache est rechargé en arrière-plan : les livres d'un
// membre du foyer peuvent avoir changé sans que cette session le sache.
export const STALE_AFTER_MS = 60_000

// Un livre modifié remplace son ancienne version, un nouveau livre arrive en
// tête (même ordre que listBooks : les plus récents d'abord).
export function upsertInList(books, book) {
  const exists = books.some((b) => b.id === book.id)
  return exists ? books.map((b) => (b.id === book.id ? book : b)) : [book, ...books]
}

export function removeFromList(books, id) {
  return books.filter((b) => b.id !== id)
}

// Le cache doit être rechargé s'il a été invalidé explicitement (action qui
// change les livres visibles) ou s'il est trop vieux.
export function needsRefresh({ invalidated, fetchedAt, now }) {
  return invalidated || now - fetchedAt > STALE_AFTER_MS
}
