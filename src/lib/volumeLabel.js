// Libellés du numéro de tome d'un livre de série. Un hors-série (livre de la
// série hors de sa numérotation) n'est jamais appelé "Tome" : son numéro,
// facultatif, est le sien (Hors-série 2), indépendant de celui des tomes.

// "Tome 3", "Hors-série 2", "Hors-série", ou null sans numéro (livre ordinaire).
export function volumeLabel(book) {
  if (book.is_off_series) {
    return book.series_index != null ? `Hors-série ${book.series_index}` : 'Hors-série'
  }
  return book.series_index != null ? `Tome ${book.series_index}` : null
}

// Texte court de la pastille ronde d'une carte : le numéro, ou "HS".
export function volumeBadge(book) {
  if (book.is_off_series) return 'HS'
  return book.series_index != null ? String(book.series_index) : null
}

// Texte d'une pastille de la rangée de tomes (voir tomeSlots.js).
export function chipLabel(slot) {
  if (slot.type === 'offSeries') {
    return slot.index != null ? `HS ${slot.index}` : 'HS'
  }
  return String(slot.index)
}
