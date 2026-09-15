import { supabase } from './supabaseClient'

// Le foyer de l'utilisateur courant : membres, invitations envoyées par
// n'importe quel membre du foyer (pas seulement par l'appelant) et
// invitations reçues. `id` est null si l'utilisateur n'appartient à aucun
// foyer pour l'instant (mais peut quand même avoir des invitations
// entrantes en attente).
export async function getMyHousehold(userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('household_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (profileError) throw profileError

  const householdId = profile?.household_id ?? null

  const [householdResult, membersResult, invitesResult, incomingResult] = await Promise.all([
    householdId
      ? supabase.from('households').select('id, name, owner_id').eq('id', householdId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    householdId
      ? supabase.from('profiles').select('user_id, display_name, email').eq('household_id', householdId)
      : Promise.resolve({ data: [], error: null }),
    householdId
      ? supabase
          .from('household_invites')
          .select('id, invitee_id, invited_by, created_at')
          .eq('household_id', householdId)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('household_invites')
      .select('id, household_id, invited_by, created_at')
      .eq('invitee_id', userId),
  ])

  if (householdResult.error) throw householdResult.error
  if (membersResult.error) throw membersResult.error
  if (invitesResult.error) throw invitesResult.error
  if (incomingResult.error) throw incomingResult.error

  const household = householdResult.data
  const invites = invitesResult.data ?? []
  const incoming = incomingResult.data ?? []

  // L'utilisateur courant toujours en tête (peu importe où l'ordre
  // alphabétique le placerait) : c'est la vue qu'on consulte le plus
  // souvent, elle doit être immédiate à repérer dans le switcher. Le tri
  // est stable (garanti depuis ES2019), donc les autres membres gardent
  // l'ordre alphabétique renvoyé par la requête.
  const members = (membersResult.data ?? []).sort((a, b) => {
    if (a.user_id === userId) return -1
    if (b.user_id === userId) return 1
    return 0
  })

  // Les invités (pas encore membres) et les inviteurs d'une invitation
  // reçue (membres d'un autre foyer) ne sont pas forcément dans `members`.
  const profilesById = new Map(members.map((m) => [m.user_id, m]))
  const missingIds = [
    ...invites.flatMap((i) => [i.invitee_id, i.invited_by]),
    ...incoming.map((i) => i.invited_by),
  ].filter((id) => id && !profilesById.has(id))

  if (missingIds.length > 0) {
    const { data: extra, error: extraError } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', [...new Set(missingIds)])
    if (extraError) throw extraError
    for (const p of extra ?? []) profilesById.set(p.user_id, p)
  }

  const labelFor = (id) =>
    profilesById.get(id)?.display_name ?? profilesById.get(id)?.email ?? 'quelqu\'un'

  return {
    id: household?.id ?? null,
    name: household?.name ?? null,
    ownerId: household?.owner_id ?? null,
    isOwner: Boolean(household) && household.owner_id === userId,
    members: members.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name,
      email: m.email,
      isOwner: m.user_id === household?.owner_id,
    })),
    invites: invites.map((i) => ({
      id: i.id,
      inviteeId: i.invitee_id,
      inviteeLabel: labelFor(i.invitee_id),
      invitedBy: i.invited_by,
      invitedByLabel: labelFor(i.invited_by),
      createdAt: i.created_at,
    })),
    incomingInvites: incoming.map((i) => ({
      id: i.id,
      householdId: i.household_id,
      invitedBy: i.invited_by,
      invitedByLabel: labelFor(i.invited_by),
      createdAt: i.created_at,
    })),
  }
}

export async function inviteToHousehold(code) {
  const clean = code.trim().toUpperCase()
  if (!clean) throw new Error('Entre un code ami.')
  const { error } = await supabase.rpc('invite_to_household', { code: clean })
  if (error) throw error
}

export async function acceptHouseholdInvite(inviteId) {
  const { error } = await supabase.rpc('accept_household_invite', { invite_id: inviteId })
  if (error) throw error
}

export async function declineHouseholdInvite(inviteId) {
  const { error } = await supabase.rpc('decline_household_invite', { invite_id: inviteId })
  if (error) throw error
}

export async function cancelHouseholdInvite(inviteId) {
  const { error } = await supabase.rpc('cancel_household_invite', { invite_id: inviteId })
  if (error) throw error
}

export async function leaveHousehold() {
  const { error } = await supabase.rpc('leave_household')
  if (error) throw error
}

export async function removeHouseholdMember(userId) {
  const { error } = await supabase.rpc('remove_member', { target_user_id: userId })
  if (error) throw error
}

export async function renameHousehold(name) {
  const { error } = await supabase.rpc('rename_household', { new_name: name })
  if (error) throw error
}
