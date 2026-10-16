import { useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useHouseholdView } from '../hooks/useHouseholdView'
import { useLibraryData } from './useLibraryData'

// Expose les livres du membre du foyer sélectionné, filtrés côté client à
// partir du cache partagé (LibraryDataProvider) : pas de requête par page ni
// par changement de membre.
export function useHouseholdBooks() {
  const { user } = useAuth()
  // null = pas de choix explicite, on regarde ses propres livres par
  // défaut. La sélection elle-même vit dans HouseholdViewProvider (partagée
  // entre Collection/Stats/Succès) pour tenir d'une page à l'autre.
  const { selectedId, setSelectedId } = useHouseholdView()
  const { allBooks, members, loading, error, refresh, ensureFresh } = useLibraryData()

  useEffect(() => {
    ensureFresh()
  }, [ensureFresh])

  const ownerId = selectedId ?? user?.id ?? null
  const isMine = ownerId === user?.id
  const books = useMemo(
    () => allBooks.filter((b) => b.user_id === ownerId),
    [allBooks, ownerId],
  )

  return { members, ownerId, setOwnerId: setSelectedId, isMine, books, loading, error, refresh }
}
