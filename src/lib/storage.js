import { supabase } from './supabaseClient'

export async function uploadCover(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const ext = file.name.split('.').pop()
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('covers')
    .upload(path, file, { contentType: file.type })
  if (error) throw error

  const { data } = supabase.storage.from('covers').getPublicUrl(path)
  return data.publicUrl
}
