import { supabase } from './supabaseClient'

// Supprime le compte et toutes ses données. Les tables liées (livres,
// objectifs de lecture, profil, liens de partage) sont nettoyées
// automatiquement par les contraintes `on delete cascade` côté base une
// fois auth.users supprimé — seuls les fichiers de couverture dans le
// storage n'ont pas de lien de clé étrangère et doivent être supprimés à
// la main, avant d'appeler la fonction qui supprime le compte.
export async function deleteMyAccount(userId) {
  const { data: files, error: listError } = await supabase.storage
    .from('covers')
    .list(userId)
  if (listError) throw listError

  if (files?.length > 0) {
    const paths = files.map((f) => `${userId}/${f.name}`)
    const { error: removeError } = await supabase.storage
      .from('covers')
      .remove(paths)
    if (removeError) throw removeError
  }

  const { error } = await supabase.rpc('delete_own_account')
  if (error) throw error
}
