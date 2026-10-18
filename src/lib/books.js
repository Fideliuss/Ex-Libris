import { supabase } from './supabaseClient'
import { deleteCover } from './storage'
import { getCurrentUserId } from './session'

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

// Sans `userId` : tous les livres visibles (les miens + ceux du foyer, selon
// la RLS). Avec `userId` : uniquement ceux de ce propriétaire, filtrés côté
// serveur (export/import n'ont aucune raison de rapatrier ceux du foyer).
export function listBooks({ userId } = {}) {
  return fetchAllPages((from, to) => {
    let query = supabase.from('books').select('*')
    if (userId) query = query.eq('user_id', userId)
    return query.order('created_at', { ascending: false }).range(from, to)
  })
}

export async function createBook(book) {
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('books')
    .insert({ ...book, user_id: userId })
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
  const { data, error } = await supabase
    .from('books')
    .delete()
    .eq('id', id)
    .select('cover_url')
    .single()
  if (error) throw error
  await deleteCover(data.cover_url)
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
// mélange avec les tomes du foyer), pour la navigation tome par tome. Les
// tomes d'abord, puis les hors-séries, chacun par numéro (sans numéro en
// dernier) : c'est l'ordre de la rangée de tomes et du précédent/suivant.
export async function getSeriesSiblings(series, userId) {
  const { data, error } = await supabase
    .from('books')
    .select('id, series_index, status, is_off_series')
    .eq('series', series)
    .eq('user_id', userId)
    .order('is_off_series', { ascending: true })
    .order('series_index', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function bulkCreateBooks(books) {
  const userId = await getCurrentUserId()

  const rows = books.map((book) => ({ ...book, user_id: userId }))
  const chunkSize = 100
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('books').insert(chunk)
    if (error) throw error
  }
}

// Nombre de requêtes UPDATE envoyées en parallèle : assez pour ne pas
// attendre chaque aller-retour l'un après l'autre, assez peu pour ne pas
// saturer la connexion.
const UPDATE_CONCURRENCY = 8

// Patchs différents d'un livre à l'autre (ajout/retrait de tag, réparation
// de série...) : une requête par livre, mais par vagues parallèles.
export async function bulkUpdateBooks(updates) {
  for (let i = 0; i < updates.length; i += UPDATE_CONCURRENCY) {
    const wave = updates.slice(i, i + UPDATE_CONCURRENCY)
    const results = await Promise.all(
      wave.map(({ id, patch }) => supabase.from('books').update(patch).eq('id', id)),
    )
    const failed = results.find((r) => r.error)
    if (failed) throw failed.error
  }
}

// Même valeur pour tous les livres : une seule requête, quel que soit leur
// nombre.
export async function bulkSetField(ids, patch) {
  if (ids.length === 0) return
  const { error } = await supabase.from('books').update(patch).in('id', ids)
  if (error) throw error
}

export async function bulkDeleteBooks(ids) {
  const { data, error } = await supabase
    .from('books')
    .delete()
    .in('id', ids)
    .select('cover_url')
  if (error) throw error
  await Promise.all(data.map((row) => deleteCover(row.cover_url)))
}

// Migration : un tag utilisé comme nom de collection éditeur (ex: "folio sf")
// devient la valeur du champ `collection` sur tous les livres concernés, et
// est retiré de leurs tags. Retourne le nombre de livres modifiés.
export async function convertTagToCollection(tag) {
  const userId = await getCurrentUserId()
  const matching = await fetchAllPages((from, to) =>
    supabase
      .from('books')
      .select('id, tags')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .range(from, to),
  )

  await bulkUpdateBooks(
    matching.map((book) => ({
      id: book.id,
      patch: {
        collection: tag,
        tags: (book.tags ?? []).filter((t) => t !== tag),
      },
    })),
  )
  return matching.length
}

// Renomme une collection ou une série sur tous les livres qui la portent.
async function renameFieldValue(field, oldValue, newValue) {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('books')
    .update({ [field]: newValue })
    .eq('user_id', userId)
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
