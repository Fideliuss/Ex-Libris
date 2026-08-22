import { supabase } from './supabaseClient'

const DEFAULT_ANNUAL_GOAL = 12

// Pas de ligne tant que l'utilisateur n'a jamais modifié son objectif :
// on retombe sur la valeur par défaut plutôt que d'exiger une ligne créée
// à l'inscription.
export async function getAnnualGoal(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('annual_goal')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.annual_goal ?? DEFAULT_ANNUAL_GOAL
}

export async function updateAnnualGoal(goal) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, annual_goal: goal })
  if (error) throw error
}
