import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { markChangelogSeen } from '../lib/profile'
import { LATEST_CHANGELOG_ID, getMissedEntries } from '../lib/whatsNew'
import ChangelogModal from '../components/ChangelogModal'

// Pas de contexte exposé aux enfants (rien à leur fournir, contrairement à
// TutorialProvider et son `replay()`) : juste un wrapper qui affiche le
// pop-up "quoi de neuf" au bon moment.
export function ChangelogProvider({ children }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [dismissedFor, setDismissedFor] = useState(null)

  // Un compte flambant neuf (has_seen_tutorial=false) n'en voit pas : le
  // tutoriel s'occupe de le marquer à jour dès qu'il se ferme, inutile
  // d'empiler ce pop-up par-dessus.
  const missedEntries = useMemo(() => {
    if (!profile || !profile.has_seen_tutorial) return []
    return getMissedEntries(profile.last_seen_changelog)
  }, [profile])

  const visible = missedEntries.length > 0 && dismissedFor !== profile?.user_id

  function close() {
    if (profile) setDismissedFor(profile.user_id)
    if (user) markChangelogSeen(user.id, LATEST_CHANGELOG_ID).catch(() => {})
  }

  return (
    <>
      {children}
      {visible && <ChangelogModal entries={missedEntries} onClose={close} />}
    </>
  )
}
