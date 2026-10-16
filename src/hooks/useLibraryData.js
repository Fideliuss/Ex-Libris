import { createContext, useContext } from 'react'

export const LibraryDataContext = createContext(undefined)

// Accès au cache partagé des livres visibles (les miens + ceux du foyer) et
// des membres du foyer. Voir LibraryDataProvider pour la stratégie de
// fraîcheur.
export function useLibraryData() {
  const ctx = useContext(LibraryDataContext)
  if (ctx === undefined) {
    throw new Error('useLibraryData doit être utilisé à l’intérieur de <LibraryDataProvider>')
  }
  return ctx
}
