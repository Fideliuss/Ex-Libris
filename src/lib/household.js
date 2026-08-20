// Les deux seuls comptes de cette app (usage personnel à deux).
// Doit rester synchronisé avec les UID codés en dur dans
// supabase/household-sharing.sql.
export const HOUSEHOLD_MEMBERS = [
  { id: '62c4fc66-007a-4018-bbf1-42c0990284c0', label: 'Brayan' },
  { id: '3d041fdc-b619-46a4-8fed-743cce2269f6', label: 'Bradley' },
]

export function getPartner(currentUserId) {
  if (!currentUserId) return null
  return HOUSEHOLD_MEMBERS.find((m) => m.id !== currentUserId) ?? null
}

export function getMemberLabel(userId) {
  return HOUSEHOLD_MEMBERS.find((m) => m.id === userId)?.label ?? null
}
