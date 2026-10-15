import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { HouseholdViewContext } from '../hooks/useHouseholdView'

export function HouseholdViewProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  // La sélection est gardée avec l'utilisateur qui l'a faite : après une
  // déconnexion/reconnexion sur le même appareil, celle d'un compte précédent
  // ne doit pas s'appliquer au suivant (elle est simplement ignorée).
  const [selection, setSelection] = useState({ userId: null, selectedId: null })
  const selectedId = selection.userId === userId ? selection.selectedId : null

  const setSelectedId = useCallback(
    (id) => setSelection({ userId, selectedId: id }),
    [userId],
  )

  const value = useMemo(() => ({ selectedId, setSelectedId }), [selectedId, setSelectedId])

  return <HouseholdViewContext.Provider value={value}>{children}</HouseholdViewContext.Provider>
}
