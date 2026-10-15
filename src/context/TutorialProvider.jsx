import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { TutorialContext } from '../hooks/useTutorial'
import { markChangelogSeen, markTutorialSeen } from '../lib/profile'
import { LATEST_CHANGELOG_ID } from '../lib/whatsNew'
import OnboardingModal from '../components/OnboardingModal'

export function TutorialProvider({ children }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [step, setStep] = useState(0)
  // Rejeu volontaire (bouton "Revoir le tutoriel" du compte).
  const [replaying, setReplaying] = useState(false)
  // Le tutoriel s'ouvre tout seul pour un compte qui ne l'a jamais vu, une
  // fois par compte et par session : fermé, un rechargement du profil ne doit
  // pas le rouvrir.
  const [dismissedFor, setDismissedFor] = useState(null)

  const autoOpen =
    Boolean(profile) && !profile.has_seen_tutorial && dismissedFor !== profile.user_id
  const open = replaying || autoOpen
  const firstName = profile?.first_name || null

  function close() {
    setReplaying(false)
    setStep(0)
    if (profile) setDismissedFor(profile.user_id)
    if (!user) return
    markTutorialSeen(user.id).catch(() => {})
    // Un compte qui vient de finir le tutoriel part avec tout ce qui existe
    // déjà : pas la peine de lui montrer un pop-up "quoi de neuf" juste
    // après, ce n'est nouveau que pour les comptes existants.
    markChangelogSeen(user.id, LATEST_CHANGELOG_ID).catch(() => {})
  }

  const replay = useCallback(() => {
    setStep(0)
    setReplaying(true)
  }, [])

  const value = useMemo(() => ({ replay }), [replay])

  return (
    <TutorialContext.Provider value={value}>
      {children}
      {open && (
        <OnboardingModal
          step={step}
          onStepChange={setStep}
          onSkip={close}
          onFinish={close}
          firstName={firstName}
        />
      )}
    </TutorialContext.Provider>
  )
}
