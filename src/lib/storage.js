import { supabase } from './supabaseClient'

const COVER_URL_MARKER = '/storage/v1/object/public/covers/'

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

// Un cover_url n'est pas toujours un fichier qu'on héberge : la recherche
// ISBN et le champ URL libre du formulaire peuvent pointer vers une image
// externe. On ne tente une suppression que sur une URL issue de notre propre
// bucket, silencieusement (best-effort) pour ne jamais faire échouer
// l'opération principale (sauvegarde/suppression du livre) à cause d'un
// nettoyage de storage qui rate.
export async function deleteCover(url) {
  if (!url) return
  const index = url.indexOf(COVER_URL_MARKER)
  if (index === -1) return
  const path = url.slice(index + COVER_URL_MARKER.length)
  const { error } = await supabase.storage.from('covers').remove([path])
  if (error) console.warn('Échec de la suppression de la cover en storage:', error)
}
