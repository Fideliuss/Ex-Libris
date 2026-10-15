import { supabase } from './supabaseClient'

// Identifiant de l'utilisateur courant, lu depuis la session locale : pas
// d'aller-retour réseau (contrairement à auth.getUser(), qui interroge
// l'API d'auth à chaque appel). La RLS côté base reste la vraie barrière :
// le JWT est de toute façon vérifié par le serveur à chaque requête.
export async function getCurrentUserId() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Session expirée, reconnecte-toi.')
  return session.user.id
}
