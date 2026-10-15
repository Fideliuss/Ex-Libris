import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { getMyProfile } from '../lib/profile'
import { ProfileContext } from '../hooks/useProfile'

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // Garde l'id avec le résultat : après un changement de compte, l'ancien
  // profil est considéré comme "pas encore chargé" plutôt que montré à tort.
  const [result, setResult] = useState({ userId: null, profile: undefined })

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const profile = await getMyProfile(userId)
      setResult({ userId, profile })
    } catch {
      // Le profil reste optionnel : une erreur ici ne doit pas bloquer l'app.
      setResult((prev) => (prev.userId === userId ? prev : { userId, profile: null }))
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const profile = result.userId === userId ? result.profile : undefined

  const value = useMemo(() => ({ profile, refreshProfile: load }), [profile, load])

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}
