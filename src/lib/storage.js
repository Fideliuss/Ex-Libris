import { supabase } from './supabaseClient'

const COVER_URL_MARKER = '/storage/v1/object/public/covers/'
const MAX_DIMENSION = 1200
const WEBP_QUALITY = 0.8

// Recompresse et uniformise chaque cover en WebP avant l'envoi (mêmes
// réglages que le nettoyage rétroactif appliqué à tout le bucket existant) :
// évite l'accumulation de photos de plusieurs Mo, ce qui a nécessité ce
// nettoyage la première fois. createImageBitmap({ imageOrientation:
// 'from-image' }) applique la rotation EXIF automatiquement, sans lib ni
// parsing manuel — les photos prises au téléphone de travers ressortent
// droites. Lève une erreur si le navigateur ne sait pas décoder le format
// (HEIC sur Chrome/Firefox, notamment) : à l'appelant de décider quoi faire,
// on ne retombe jamais silencieusement sur le fichier non compressé.
export async function compressImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Échec de l’encodage WebP'))),
      'image/webp',
      WEBP_QUALITY,
    )
  })
  return blob
}

// N'accepte plus que des blobs déjà compressés par compressImage : toutes
// les covers du bucket sont en .webp (y compris après le nettoyage
// rétroactif des covers existantes), l'extension n'a donc plus besoin
// d'être déduite du fichier d'origine.
export async function uploadCover(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = `${user.id}/${crypto.randomUUID()}.webp`

  const { error } = await supabase.storage
    .from('covers')
    .upload(path, file, { contentType: 'image/webp' })
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
