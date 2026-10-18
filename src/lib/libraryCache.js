// Règles pures du cache de livres (voir LibraryDataProvider), isolées du
// composant pour pouvoir les tester sans rendu React.

// Au-delà de cet âge, les livres d'un autre membre du foyer sont rechargés à
// la prochaine bascule sur lui : il a pu les modifier sans que cette session
// le sache.
export const STALE_AFTER_MS = 60_000

// Mes propres livres ne changent que par moi dans cette session : seul un
// autre appareil peut les avoir modifiés, d'où un délai bien plus long.
export const OWN_STALE_AFTER_MS = 10 * 60_000

// Un livre modifié remplace son ancienne version, un nouveau livre arrive en
// tête (même ordre que listBooks : les plus récents d'abord).
export function upsertInList(books, book) {
  const exists = books.some((b) => b.id === book.id)
  return exists ? books.map((b) => (b.id === book.id ? book : b)) : [book, ...books]
}

export function removeFromList(books, id) {
  return books.filter((b) => b.id !== id)
}

// Les livres d'un propriétaire (moi ou un autre membre) sont chargés à la
// demande. `entry` est ce que le cache garde pour lui, absent s'il n'a jamais
// été demandé. Un chargement qui a échoué (loaded false) est retenté.
export function shouldLoadOwner({ entry, isMine, invalidated, now }) {
  if (!entry || !entry.loaded) return true
  if (invalidated) return true
  return now - entry.fetchedAt > (isMine ? OWN_STALE_AFTER_MS : STALE_AFTER_MS)
}
