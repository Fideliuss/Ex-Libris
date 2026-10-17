import { supabase } from './supabaseClient'

// État de révélation des succès (voir baseline.sql, table
// achievement_claims) : rank est le palier confirmé pour un succès à
// paliers, ou une valeur sans signification particulière pour un succès
// unique (seule l'existence de la ligne compte, voir AchievementsGallery).
export async function listClaims(userId) {
  const { data, error } = await supabase
    .from('achievement_claims')
    .select('badge_id, rank')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function upsertClaim(userId, badgeId, rank) {
  const { error } = await supabase
    .from('achievement_claims')
    .upsert({ user_id: userId, badge_id: badgeId, rank }, { onConflict: 'user_id,badge_id' })
  if (error) throw error
}
