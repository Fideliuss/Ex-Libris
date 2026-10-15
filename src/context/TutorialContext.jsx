import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { useProfile } from '../hooks/useProfile'
import { markChangelogSeen, markTutorialSeen } from '../lib/profile'
import { LATEST_CHANGELOG_ID } from '../lib/whatsNew'
import OnboardingModal from '../components/OnboardingModal'

const TutorialContext = createContext(undefined)

export function TutorialProvider({ children }) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  // Le tutoriel ne s'ouvre automatiquement qu'une fois par compte et par
  // session : un rechargement du profil ne doit pas le rouvrir.
  const autoOpenedFor = useRef(null)
  const firstName = profile?.first_name || null

  useEffect(() => {
    if (!profile || autoOpenedFor.current === profile.user_id) return
    autoOpenedFor.current = profile.user_id
    if (!profile.has_seen_tutorial) {
      setStep(0)
      setOpen(true)
    }
  }, [profile])

  function close() {
    setOpen(false)
    if (!user) return
    markTutorialSeen(user.id).catch(() => {})
    // Un compte qui vient de finir le tutoriel part avec tout ce qui existe
    // déjà : pas la peine de lui montrer un pop-up "quoi de neuf" juste
    // après, ce n'est nouveau que pour les comptes existants.
    markChangelogSeen(user.id, LATEST_CHANGELOG_ID).catch(() => {})
  }

  const replay = useCallback(() => {
    setStep(0)
    setOpen(true)
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

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (ctx === undefined) {
    throw new Error("useTutorial doit être utilisé à l'intérieur de <TutorialProvider>")
  }
  return ctx
}
