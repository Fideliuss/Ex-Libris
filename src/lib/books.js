import { supabase } from './supabaseClient'

const LIST_PAGE_SIZE = 1000

// PostgREST plafonne une requête sans .range() à 1000 lignes par défaut :
// au-delà, un .select() simple tronque silencieusement le résultat. On
// pagine explicitement pour ramener vraiment toutes les lignes visibles,
// quelle que soit la taille de la table — buildQuery reçoit les bornes
// (from, to) et doit renvoyer la requête Supabase déjà filtrée/triée, prête
// à recevoir .range(from, to).
async function fetchAllPages(buildQuery) {
  const rows = []
  let from = 0
  for (;;) {
    const { data, error } = await buildQuery(from, from + LIST_PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < LIST_PAGE_SIZE) break
    from += LIST_PAGE_SIZE
  }
  return rows
}

export function listBooks() {
  return fetchAllPages((from, to) =>
    supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to),
  )
}

export async function createBook(book) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .insert({ ...book, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBook(id, patch) {
  const { data, error } = await supabase
    .from('books')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteBook(id) {
  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error
}

export async function getBook(id) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// Les autres tomes de la même série, chez le même propriétaire (pas de
// mélange avec les tomes du foyer), pour la navigation tome par tome.
export async function getSeriesSiblings(series, userId) {
  const { data, error } = await supabase
    .from('books')
    .select('id, series_index, status')
    .eq('series', series)
    .eq('user_id', userId)
    .order('series_index', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function bulkCreateBooks(books) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const rows = books.map((book) => ({ ...book, user_id: user.id }))
  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('books').insert(chunk)
    if (error) throw error
  }
}

export async function bulkUpdateBooks(updates) {
  for (const { id, patch } of updates) {
    const { error } = await supabase.from('books').update(patch).eq('id', id)
    if (error) throw error
  }
}

export async function bulkDeleteBooks(ids) {
  const { error } = await supabase.from('books').delete().in('id', ids)
  if (error) throw error
}

// Valeurs distinctes d'une colonne à valeurs multiples (tags, author,
// translator, illustrator...) sur les livres de l'utilisateur courant, pour
// alimenter les suggestions de saisie (TagInput). Un seul aller-retour
// réseau par colonne : on aplatit côté client plutôt que de demander à
// Postgres de le faire, pour rester simple.
async function listDistinctArrayValues(column) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await fetchAllPages((from, to) =>
    supabase.from('books').select(column).eq('user_id', user.id).range(from, to),
  )
  const values = new Set()
  for (const row of data) {
    for (const value of row[column] ?? []) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function listAllTags() {
  return listDistinctArrayValues('tags')
}

export function listAllAuthors() {
  return listDistinctArrayValues('author')
}

export function listAllTranslators() {
  return listDistinctArrayValues('translator')
}

export function listAllIllustrators() {
  return listDistinctArrayValues('illustrator')
}

// Valeurs distinctes d'une colonne simple (pas un tableau, contrairement à
// listDistinctArrayValues ci-dessus) sur les livres de l'utilisateur courant.
async function listDistinctColumnValues(column) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const data = await fetchAllPages((from, to) =>
    supabase
      .from('books')
      .select(column)
      .eq('user_id', user.id)
      .not(column, 'is', null)
      .range(from, to),
  )
  const values = new Set(data.map((row) => row[column]).filter(Boolean))
  return [...values].sort((a, b) => a.localeCompare(b, 'fr'))
}

export function listAllCollections() {
  return listDistinctColumnValues('collection')
}

export function listAllPublishers() {
  return listDistinctColumnValues('publisher')
}

export function listAllSeries() {
  return listDistinctColumnValues('series')
}

export function listAllUniverses() {
  return listDistinctColumnValues('universe')
}

// Migration : un tag utilisé comme nom de collection éditeur (ex: "folio sf")
// devient la valeur du champ `collection` sur tous les livres concernés, et
// est retiré de leurs tags. Retourne le nombre de livres modifiés.
export async function convertTagToCollection(tag) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const matching = await fetchAllPages((from, to) =>
    supabase
      .from('books')
      .select('id, tags')
      .eq('user_id', user.id)
      .contains('tags', [tag])
      .range(from, to),
  )

  for (const book of matching) {
    const { error } = await supabase
      .from('books')
      .update({
        collection: tag,
        tags: (book.tags ?? []).filter((t) => t !== tag),
      })
      .eq('id', book.id)
    if (error) throw error
  }
  return matching.length
}

// Renomme une collection ou une série sur tous les livres qui la portent.
async function renameFieldValue(field, oldValue, newValue) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('books')
    .update({ [field]: newValue })
    .eq('user_id', user.id)
    .eq(field, oldValue)
  if (error) throw error
}

export function renamePublisher(oldName, newName) {
  return renameFieldValue('publisher', oldName, newName)
}

export function renameCollection(oldName, newName) {
  return renameFieldValue('collection', oldName, newName)
}

export function renameSeries(oldName, newName) {
  return renameFieldValue('series', oldName, newName)
}
