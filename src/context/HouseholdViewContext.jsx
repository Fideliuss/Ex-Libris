import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

// Quel membre du foyer on regarde ("moi" par défaut, null) — vit ici plutôt
// que dans useHouseholdBooks (appelé séparément par Collection, Stats et
// Succès) pour que la sélection tienne d'une page à l'autre. Avant ce
// contexte, chaque page remontait son propre useState(null), donc naviguer
// vers Stats/Succès ou faire "Retour" depuis une fiche livre retombait
// systématiquement sur sa propre bibliothèque (bug réel rencontré).
const HouseholdViewContext = createContext(undefined)

export function HouseholdViewProvider({ children }) {
  const { user } = useAuth()
  const [selectedId, setSelectedId] = useState(null)

  // Un changement d'utilisateur (déconnexion/reconnexion sur le même
  // appareil) ne doit pas laisser la sélection d'un compte précédent
  // s'appliquer au suivant.
  useEffect(() => {
    setSelectedId(null)
  }, [user?.id])

  return (
    <HouseholdViewContext.Provider value={{ selectedId, setSelectedId }}>
      {children}
    </HouseholdViewContext.Provider>
  )
}

export function useHouseholdView() {
  const ctx = useContext(HouseholdViewContext)
  if (ctx === undefined) {
    throw new Error(
      'useHouseholdView doit être utilisé à l’intérieur de <HouseholdViewProvider>',
    )
  }
  return ctx
}
