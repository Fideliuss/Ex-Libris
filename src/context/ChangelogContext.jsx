import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getMyProfile, markChangelogSeen } from '../lib/friendCode'
import { LATEST_CHANGELOG_ID, WHATS_NEW } from '../lib/whatsNew'
import ChangelogModal from '../components/ChangelogModal'

// Pas de contexte exposé aux enfants (rien à leur fournir, contrairement à
// TutorialContext et son `replay()`) : juste un wrapper qui affiche le
// pop-up "quoi de neuf" au bon moment.
export function ChangelogProvider({ children }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    getMyProfile(user.id)
      .then((profile) => {
        if (!active || !profile) return
        // has_seen_tutorial=false : compte flambant neuf, TutorialContext
        // s'occupe de le marquer à jour dès qu'il ferme le tutoriel — pas la
        // peine d'empiler ce pop-up par-dessus le tutoriel en plus.
        if (profile.has_seen_tutorial && profile.last_seen_changelog !== LATEST_CHANGELOG_ID) {
          setOpen(true)
        }
      })
      .catch(() => {
        // Optionnel : une erreur ici ne doit pas bloquer le reste de l'app.
      })
    return () => {
      active = false
    }
  }, [user])

  function close() {
    setOpen(false)
    if (user) markChangelogSeen(user.id, LATEST_CHANGELOG_ID).catch(() => {})
  }

  return (
    <>
      {children}
      {open && <ChangelogModal entry={WHATS_NEW[0]} onClose={close} />}
    </>
  )
}
