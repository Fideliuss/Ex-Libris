import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { getMyProfile, markChangelogSeen, markTutorialSeen } from '../lib/friendCode'
import { LATEST_CHANGELOG_ID } from '../lib/whatsNew'
import OnboardingModal from '../components/OnboardingModal'

const TutorialContext = createContext(undefined)

export function TutorialProvider({ children }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [firstName, setFirstName] = useState(null)

  useEffect(() => {
    if (!user) return
    let active = true
    getMyProfile(user.id)
      .then((profile) => {
        if (!active || !profile) return
        setFirstName(profile.first_name || null)
        if (!profile.has_seen_tutorial) {
          setStep(0)
          setOpen(true)
        }
      })
      .catch(() => {
        // Le tutoriel reste optionnel : une erreur ici ne doit pas bloquer
        // le reste de l'app.
      })
    return () => {
      active = false
    }
  }, [user])

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

  return (
    <TutorialContext.Provider value={{ replay }}>
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
