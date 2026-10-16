import { supabase } from './supabaseClient'
import { getCurrentUserId } from './session'

export const DEFAULT_GOAL = 12

export async function updateReadingGoal(year, goal) {
  const userId = await getCurrentUserId()
  const { error } = await supabase
    .from('reading_goals')
    .upsert({ user_id: userId, year, goal })
  if (error) throw error
}

// Historique complet des objectifs fixés par l'utilisateur, du plus récent
// au plus ancien.
export async function getReadingGoalHistory(userId) {
  const { data, error } = await supabase
    .from('reading_goals')
    .select('year, goal')
    .eq('user_id', userId)
    .order('year', { ascending: false })
  if (error) throw error
  return data ?? []
}
