import { createContext, useContext } from 'react'

export const HouseholdViewContext = createContext(undefined)

// Quel membre du foyer on regarde ("moi" par défaut, null). La sélection vit
// dans un contexte plutôt que dans useHouseholdBooks (appelé séparément par
// Collection, Stats et Succès) pour tenir d'une page à l'autre : avant, chaque
// page remontait son propre useState(null), donc naviguer vers Stats/Succès ou
// faire "Retour" depuis une fiche livre retombait sur sa propre bibliothèque.
export function useHouseholdView() {
  const ctx = useContext(HouseholdViewContext)
  if (ctx === undefined) {
    throw new Error(
      'useHouseholdView doit être utilisé à l’intérieur de <HouseholdViewProvider>',
    )
  }
  return ctx
}
