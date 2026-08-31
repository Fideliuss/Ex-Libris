import { supabase } from './supabaseClient'

// PostgREST plafonne une requête sans .range() à 1000 lignes par défaut :
// au-delà, un .select('*') simple tronque silencieusement le résultat. On
// pagine explicitement pour ramener vraiment tous les livres visibles,
// quelle que soit la taille de la table.
const LIST_PAGE_SIZE = 1000

export async function listBooks() {
  const rows = []
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + LIST_PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < LIST_PAGE_SIZE) break
    from += LIST_PAGE_SIZE
  }
  return rows
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

export async function listAllTags() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .select('tags')
    .eq('user_id', user.id)
  if (error) throw error
  const tags = new Set()
  for (const row of data) {
    for (const tag of row.tags ?? []) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'fr'))
}

export async function listAllCollections() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .select('collection')
    .eq('user_id', user.id)
    .not('collection', 'is', null)
  if (error) throw error
  const collections = new Set(data.map((row) => row.collection).filter(Boolean))
  return [...collections].sort((a, b) => a.localeCompare(b, 'fr'))
}

export async function listAllEditions() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .select('edition')
    .eq('user_id', user.id)
    .not('edition', 'is', null)
  if (error) throw error
  const editions = new Set(data.map((row) => row.edition).filter(Boolean))
  return [...editions].sort((a, b) => a.localeCompare(b, 'fr'))
}

export async function listAllPublishers() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .select('publisher')
    .eq('user_id', user.id)
    .not('publisher', 'is', null)
  if (error) throw error
  const publishers = new Set(data.map((row) => row.publisher).filter(Boolean))
  return [...publishers].sort((a, b) => a.localeCompare(b, 'fr'))
}

export async function listAllSeries() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .select('series')
    .eq('user_id', user.id)
    .not('series', 'is', null)
  if (error) throw error
  const series = new Set(data.map((row) => row.series).filter(Boolean))
  return [...series].sort((a, b) => a.localeCompare(b, 'fr'))
}

export async function listAllUniverses() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('books')
    .select('universe')
    .eq('user_id', user.id)
    .not('universe', 'is', null)
  if (error) throw error
  const universes = new Set(data.map((row) => row.universe).filter(Boolean))
  return [...universes].sort((a, b) => a.localeCompare(b, 'fr'))
}

// Migration : un tag utilisé comme nom de collection éditeur (ex: "folio sf")
// devient la valeur du champ `collection` sur tous les livres concernés, et
// est retiré de leurs tags. Retourne le nombre de livres modifiés.
export async function convertTagToCollection(tag) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: matching, error: fetchError } = await supabase
    .from('books')
    .select('id, tags')
    .eq('user_id', user.id)
    .contains('tags', [tag])
  if (fetchError) throw fetchError

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
