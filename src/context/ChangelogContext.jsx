import { useEffect, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useProfile } from '../hooks/useProfile'
import { markChangelogSeen } from '../lib/profile'
import { LATEST_CHANGELOG_ID, getMissedEntries } from '../lib/whatsNew'
import ChangelogModal from '../components/ChangelogModal'

// Pas de contexte exposé aux enfants (rien à leur fournir, contrairement à
// TutorialContext et son `replay()`) : juste un wrapper qui affiche le
// pop-up "quoi de neuf" au bon moment.
export function ChangelogProvider({ children }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [missedEntries, setMissedEntries] = useState([])
  const checkedFor = useRef(null)

  useEffect(() => {
    if (!profile || checkedFor.current === profile.user_id) return
    checkedFor.current = profile.user_id
    // has_seen_tutorial=false : compte flambant neuf, TutorialContext
    // s'occupe de le marquer à jour dès qu'il ferme le tutoriel : pas la
    // peine d'empiler ce pop-up par-dessus le tutoriel en plus.
    if (!profile.has_seen_tutorial) return
    const missed = getMissedEntries(profile.last_seen_changelog)
    if (missed.length > 0) setMissedEntries(missed)
  }, [profile])

  function close() {
    setMissedEntries([])
    if (user) markChangelogSeen(user.id, LATEST_CHANGELOG_ID).catch(() => {})
  }

  return (
    <>
      {children}
      {missedEntries.length > 0 && (
        <ChangelogModal entries={missedEntries} onClose={close} />
      )}
    </>
  )
}
