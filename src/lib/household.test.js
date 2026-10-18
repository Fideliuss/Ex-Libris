import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabaseClient', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase')
  return { supabase: createFakeSupabase() }
})

import { supabase as fake } from './supabaseClient'
import {
  acceptHouseholdInvite,
  cancelHouseholdInvite,
  declineHouseholdInvite,
  getMyHousehold,
  inviteToHousehold,
  leaveHousehold,
  removeHouseholdMember,
  renameHousehold,
} from './household'

const ok = (data) => ({ data, error: null })
const boom = { data: null, error: { message: 'boom' } }

const alice = { user_id: 'u1', display_name: 'Alice', email: 'a@x.fr' }
const bruno = { user_id: 'u2', display_name: 'Bruno', email: 'b@x.fr' }

beforeEach(() => fake.reset())

// Programme les réponses d'un foyer : le profil de l'appelant, puis le foyer,
// ses membres, ses invitations envoyées et reçues (dans l'ordre où le code
// les demande).
function queueHousehold({ householdId = 'h1', owner = 'u1', members = [alice, bruno], invites = [], incoming = [] }) {
  fake.queue('profiles', ok({ household_id: householdId }), ok(members))
  fake.queue('households', ok({ id: householdId, name: 'Foyer', owner_id: owner }))
  fake.queue('household_invites', ok(invites), ok(incoming))
}

describe('getMyHousehold', () => {
  it('describes a household: name, owner and members, the caller first', async () => {
    queueHousehold({ members: [bruno, alice] })
    const household = await getMyHousehold('u1')
    expect(household).toMatchObject({ id: 'h1', name: 'Foyer', ownerId: 'u1', isOwner: true })
    expect(household.members.map((m) => m.userId)).toEqual(['u1', 'u2'])
    expect(household.members.map((m) => m.isOwner)).toEqual([true, false])
  })

  it('says the caller is not the owner when somebody else owns the household', async () => {
    queueHousehold({ owner: 'u2' })
    expect((await getMyHousehold('u1')).isOwner).toBe(false)
  })

  it('returns an empty household for a user who has none yet', async () => {
    fake.queue('profiles', ok({ household_id: null }))
    fake.queue('household_invites', ok([]))
    const household = await getMyHousehold('u1')
    expect(household).toMatchObject({
      id: null,
      name: null,
      ownerId: null,
      isOwner: false,
      members: [],
      invites: [],
      incomingInvites: [],
    })
    // Seule la requête des invitations reçues part : rien d'autre à lire.
    expect(fake.state.calls.map((c) => c.table)).toEqual(['profiles', 'household_invites'])
  })

  it('names the people behind invitations, reading the missing profiles once', async () => {
    const carole = { user_id: 'u3', display_name: 'Carole', email: 'c@x.fr' }
    queueHousehold({
      invites: [{ id: 'i1', invitee_id: 'u3', invited_by: 'u1', created_at: 't1' }],
      incoming: [{ id: 'i2', household_id: 'h9', invited_by: 'u3', created_at: 't2' }],
    })
    fake.queue('profiles', ok([carole]))
    const household = await getMyHousehold('u1')

    expect(household.invites).toEqual([
      {
        id: 'i1',
        inviteeId: 'u3',
        inviteeLabel: 'Carole',
        invitedBy: 'u1',
        invitedByLabel: 'Alice',
        createdAt: 't1',
      },
    ])
    expect(household.incomingInvites).toEqual([
      { id: 'i2', householdId: 'h9', invitedBy: 'u3', invitedByLabel: 'Carole', createdAt: 't2' },
    ])
    const extraRead = fake.callsTo('profiles')[2]
    expect(fake.opsOf(extraRead)).toContainEqual(['in', 'user_id', ['u3']])
  })

  it('falls back to the email, then to "quelqu\'un", when a name is missing', async () => {
    queueHousehold({
      invites: [
        { id: 'i1', invitee_id: 'u3', invited_by: 'u1', created_at: 't' },
        { id: 'i2', invitee_id: 'u4', invited_by: 'u1', created_at: 't' },
      ],
    })
    fake.queue('profiles', ok([{ user_id: 'u3', display_name: null, email: 'c@x.fr' }]))
    const household = await getMyHousehold('u1')
    expect(household.invites.map((i) => i.inviteeLabel)).toEqual(['c@x.fr', "quelqu'un"])
  })

  it('does not read extra profiles when everybody is already a member', async () => {
    queueHousehold({ invites: [{ id: 'i1', invitee_id: 'u2', invited_by: 'u1', created_at: 't' }] })
    await getMyHousehold('u1')
    expect(fake.callsTo('profiles')).toHaveLength(2)
  })

  it('throws when the profile cannot be read', async () => {
    fake.queue('profiles', boom)
    await expect(getMyHousehold('u1')).rejects.toEqual({ message: 'boom' })
  })

  it('throws when the household cannot be read', async () => {
    fake.queue('profiles', ok({ household_id: 'h1' }), ok([alice]))
    fake.queue('households', boom)
    fake.queue('household_invites', ok([]), ok([]))
    await expect(getMyHousehold('u1')).rejects.toEqual({ message: 'boom' })
  })

  it('throws when the invitations cannot be read', async () => {
    fake.queue('profiles', ok({ household_id: 'h1' }), ok([alice]))
    fake.queue('households', ok({ id: 'h1', name: 'F', owner_id: 'u1' }))
    fake.queue('household_invites', ok([]), boom)
    await expect(getMyHousehold('u1')).rejects.toEqual({ message: 'boom' })
  })
})

describe('household actions', () => {
  it('invites by friend code, trimmed and in capitals', async () => {
    await inviteToHousehold('  ab12cd  ')
    expect(fake.state.rpcCalls).toEqual([{ name: 'invite_to_household', args: { code: 'AB12CD' } }])
  })

  it('refuses an empty code without calling the database', async () => {
    await expect(inviteToHousehold('   ')).rejects.toThrow('Entre un code ami.')
    expect(fake.state.rpcCalls).toEqual([])
  })

  it.each([
    ['acceptHouseholdInvite', acceptHouseholdInvite, ['i1'], 'accept_household_invite', { invite_id: 'i1' }],
    ['declineHouseholdInvite', declineHouseholdInvite, ['i1'], 'decline_household_invite', { invite_id: 'i1' }],
    ['cancelHouseholdInvite', cancelHouseholdInvite, ['i1'], 'cancel_household_invite', { invite_id: 'i1' }],
    ['leaveHousehold', leaveHousehold, [], 'leave_household', undefined],
    ['removeHouseholdMember', removeHouseholdMember, ['u2'], 'remove_member', { target_user_id: 'u2' }],
    ['renameHousehold', renameHousehold, ['Chez nous'], 'rename_household', { new_name: 'Chez nous' }],
  ])('%s calls the matching database function', async (_label, action, args, name, rpcArgs) => {
    await action(...args)
    expect(fake.state.rpcCalls).toEqual([{ name, args: rpcArgs }])
  })

  it('throws the database error of an action', async () => {
    fake.queueRpc(boom)
    await expect(leaveHousehold()).rejects.toEqual({ message: 'boom' })
  })
})
