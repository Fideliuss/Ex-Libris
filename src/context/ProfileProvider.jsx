import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getMyProfile } from '../lib/profile'
import { ProfileContext } from '../hooks/useProfile'

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // Garde l'id avec le résultat : après un changement de compte, l'ancien
  // profil est considéré comme "pas encore chargé" plutôt que montré à tort.
  const [result, setResult] = useState({ userId: null, profile: undefined })

  useEffect(() => {
    if (!userId) return
    let active = true
    getMyProfile(userId)
      .then((profile) => {
        if (active) setResult({ userId, profile })
      })
      .catch(() => {
        // Le profil reste optionnel : une erreur ici ne doit pas bloquer l'app.
        if (active) setResult((prev) => (prev.userId === userId ? prev : { userId, profile: null }))
      })
    return () => {
      active = false
    }
  }, [userId])

  // Rechargement à la demande (après une modification du profil).
  const refreshProfile = useCallback(async () => {
    if (!userId) return
    try {
      setResult({ userId, profile: await getMyProfile(userId) })
    } catch {
      // On garde l'ancienne valeur.
    }
  }, [userId])

  const profile = result.userId === userId ? result.profile : undefined

  const value = useMemo(() => ({ profile, refreshProfile }), [profile, refreshProfile])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
