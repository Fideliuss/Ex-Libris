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

export async function listAllTags() {
  const { data, error } = await supabase.from('books').select('tags')
  if (error) throw error
  const tags = new Set()
  for (const row of data) {
    for (const tag of row.tags ?? []) tags.add(tag)
  }
  return [...tags].sort((a, b) => a.localeCompare(b, 'fr'))
}
