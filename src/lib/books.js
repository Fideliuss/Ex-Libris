import { supabase } from './supabaseClient'

export async function listBooks() {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
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
