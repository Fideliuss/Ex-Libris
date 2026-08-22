import { supabase } from './supabaseClient'

const DEFAULT_GOAL = 12

// Pas de ligne tant que l'utilisateur n'a jamais fixé d'objectif pour cette
// année : on retombe sur la valeur par défaut plutôt que d'exiger une ligne
// créée à l'avance pour chaque année.
export async function getReadingGoal(userId, year) {
  const { data, error } = await supabase
    .from('reading_goals')
    .select('goal')
    .eq('user_id', userId)
    .eq('year', year)
    .maybeSingle()
  if (error) throw error
  return data?.goal ?? DEFAULT_GOAL
}

export async function updateReadingGoal(year, goal) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('reading_goals')
    .upsert({ user_id: user.id, year, goal })
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
