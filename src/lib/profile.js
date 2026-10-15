import { supabase } from './supabaseClient'

export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'user_id, display_name, first_name, last_name, email, friend_code, has_seen_tutorial, last_seen_changelog',
    )
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function markTutorialSeen(userId) {
  const { error } = await supabase
    .from('profiles')
    .update({ has_seen_tutorial: true })
    .eq('user_id', userId)
  if (error) throw error
}

export async function markChangelogSeen(userId, changelogId) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_seen_changelog: changelogId })
    .eq('user_id', userId)
  if (error) throw error
}

// display_name suit le prénom, comme à l'inscription (handle_new_user_profile) :
// c'est ce nom qui est montré aux autres membres du foyer, donc il doit
// rester cohérent avec ce que l'utilisateur vient de saisir.
export async function updateMyProfile(userId, { firstName, lastName }) {
  const fname = firstName.trim()
  const lname = lastName.trim()
  const { error } = await supabase
    .from('profiles')
    .update({ first_name: fname, last_name: lname || null, display_name: fname })
    .eq('user_id', userId)
  if (error) throw error
}

