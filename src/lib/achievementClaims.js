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

const MIGRATION_FLAG_PREFIX = 'exlibris:migrated:'

// Reprend ce qui traînait en localStorage (ancien stockage, voir
// AchievementsGallery avant cette migration) et l'upsert dans la table.
// Ne tourne qu'une fois par appareil (flag dédié, en dehors du préfixe
// `exlibris:<userId>:` scanné ci-dessous pour ne pas se scanner
// lui-même) ; idempotent sinon (upsert), donc sans risque si le flag ne
// s'écrit pas (stockage indisponible, navigation privée...).
export async function migrateLocalStorageClaims(userId) {
  if (!userId) return
  const migrationFlagKey = `${MIGRATION_FLAG_PREFIX}${userId}`

  let alreadyMigrated
  try {
    alreadyMigrated = localStorage.getItem(migrationFlagKey)
  } catch {
    return
  }
  if (alreadyMigrated) return

  const prefix = `exlibris:${userId}:`
  const toMigrate = []
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key?.startsWith(prefix)) continue
      const rank = Number.parseInt(localStorage.getItem(key), 10)
      if (Number.isFinite(rank)) {
        toMigrate.push({ user_id: userId, badge_id: key.slice(prefix.length), rank })
      }
    }
  } catch {
    return
  }

  if (toMigrate.length > 0) {
    const { error } = await supabase
      .from('achievement_claims')
      .upsert(toMigrate, { onConflict: 'user_id,badge_id' })
    if (error) throw error
  }

  try {
    localStorage.setItem(migrationFlagKey, '1')
  } catch {
    // Tant pis : upsert étant idempotent, on retentera au prochain chargement.
  }
}
