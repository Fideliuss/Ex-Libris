import { supabase } from './supabaseClient'

const UNIQUE_VIOLATION = '23505'

export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, display_name, first_name, last_name, email, friend_code')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

// display_name suit le prénom, comme à l'inscription (handle_new_user_profile) :
// c'est ce nom qui est montré au partenaire lié, donc il doit rester cohérent
// avec ce que l'utilisateur vient de saisir.
export async function updateMyProfile(userId, { firstName, lastName }) {
  const fname = firstName.trim()
  const lname = lastName.trim()
  const { error } = await supabase
    .from('profiles')
    .update({ first_name: fname, last_name: lname || null, display_name: fname })
    .eq('user_id', userId)
  if (error) throw error
}

// Les liens visibles par l'utilisateur : au plus un accepté (le modèle
// actuel est un binôme, pas un foyer à plusieurs membres), plus les
// demandes en attente dans les deux sens.
export async function getMyLinks(userId) {
  const { data, error } = await supabase
    .from('household_links')
    .select('id, requester_id, target_id, status, created_at')
    .or(`requester_id.eq.${userId},target_id.eq.${userId}`)
  if (error) throw error

  const links = data ?? []
  const accepted = links.find((l) => l.status === 'accepted') ?? null
  const outgoingPending =
    links.find((l) => l.status === 'pending' && l.requester_id === userId) ?? null
  const incomingPending = links.filter(
    (l) => l.status === 'pending' && l.target_id === userId,
  )

  const otherIds = [
    accepted &&
      (accepted.requester_id === userId ? accepted.target_id : accepted.requester_id),
    outgoingPending?.target_id,
    ...incomingPending.map((l) => l.requester_id),
  ].filter(Boolean)

  const profilesById = new Map()
  if (otherIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', otherIds)
    if (profilesError) throw profilesError
    for (const p of profiles ?? []) profilesById.set(p.user_id, p)
  }

  const withOther = (link, otherId) => ({ ...link, other: profilesById.get(otherId) ?? null })

  return {
    accepted: accepted
      ? withOther(
          accepted,
          accepted.requester_id === userId ? accepted.target_id : accepted.requester_id,
        )
      : null,
    outgoingPending: outgoingPending
      ? withOther(outgoingPending, outgoingPending.target_id)
      : null,
    incomingPending: incomingPending.map((l) => withOther(l, l.requester_id)),
  }
}

// Le badge et les pages qui affichent "mon" partenaire actuel n'ont besoin
// que du lien accepté (une seule paire à la fois).
export async function getAcceptedPartner(userId) {
  if (!userId) return null
  const { accepted } = await getMyLinks(userId)
  if (!accepted) return null
  const otherId =
    accepted.requester_id === userId ? accepted.target_id : accepted.requester_id
  return { id: otherId, label: accepted.other?.display_name ?? 'ton partenaire' }
}

export async function sendFriendRequest(code, currentUserId) {
  const clean = code.trim().toUpperCase()
  if (!clean) throw new Error('Entre un code ami.')

  const { data: matches, error: rpcError } = await supabase.rpc('find_user_by_code', {
    code: clean,
  })
  if (rpcError) throw rpcError
  const match = matches?.[0]
  if (!match) throw new Error('Code ami introuvable.')
  if (match.user_id === currentUserId) {
    throw new Error('Tu ne peux pas utiliser ton propre code.')
  }

  const { error } = await supabase
    .from('household_links')
    .insert({ requester_id: currentUserId, target_id: match.user_id })
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new Error('Une demande existe déjà avec cette personne.')
    }
    throw error
  }
}

export async function acceptLink(linkId) {
  const { error } = await supabase
    .from('household_links')
    .update({ status: 'accepted' })
    .eq('id', linkId)
  if (error) throw error
}

export async function removeLink(linkId) {
  const { error } = await supabase.from('household_links').delete().eq('id', linkId)
  if (error) throw error
}
