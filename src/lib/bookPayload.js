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

export function pickEditable(book) {
  return Object.fromEntries(
    EDITABLE_BOOK_COLUMNS.filter((column) => column in book).map((column) => [column, book[column]]),
  )
}
