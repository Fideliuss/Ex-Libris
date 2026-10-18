// Liste sans valeurs vides, ou null si rien ne reste : les champs à valeurs
// multiples (auteurs, éditions...) sont stockés à null plutôt qu'en tableau
// vide, comme partout dans l'app.
export function nullIfEmpty(list) {
  const cleaned = (list ?? []).filter(Boolean)
  return cleaned.length > 0 ? cleaned : null
}

// Colonnes qu'un formulaire peut écrire. `id`, `user_id`, `created_at` et
// `updated_at` sont gérés par la base : ne jamais les renvoyer dans un
// insert/update, même si l'objet édité les contient (cas d'une fiche chargée
// depuis la base).
export const EDITABLE_BOOK_COLUMNS = [
  'title',
  'author',
  'translator',
  'illustrator',
  'publisher',
  'collection',
  'edition',
  'isbn',
  'cover_url',
  'description',
  'series',
  'series_index',
  'is_off_series',
  'type',
  'universe',
  'tags',
  'status',
  'date_started',
  'date_finished',
  'rating',
  'page_count',
  'notes',
  'favorite_quote',
  'price',
  'purchase_date',
]

// Valeur du champ Tome (texte du formulaire) : vide = pas de numéro, sinon un
// entier. La base refuse un numéro décimal ; on le dit ici, avec un message
// lisible, plutôt que de laisser remonter l'erreur de contrainte.
export function parseSeriesIndex(value) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  if (text === '') return null
  const number = Number(text)
  if (!Number.isInteger(number)) throw new Error('Le numéro de tome doit être un nombre entier.')
  return number
}

// Les trois champs de série ensemble : un hors-série appartient à une série,
// donc sans série le drapeau retombe à faux (la base refuse l'inverse).
export function seriesFields({ series, series_index, is_off_series }) {
  const cleanSeries = series?.trim() || null
  return {
    series: cleanSeries,
    series_index: parseSeriesIndex(series_index),
    is_off_series: Boolean(is_off_series) && cleanSeries !== null,
  }
}

export function pickEditable(book) {
  return Object.fromEntries(
    EDITABLE_BOOK_COLUMNS.filter((column) => column in book).map((column) => [column, book[column]]),
  )
}
