import { useCallback, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useHouseholdView } from '../hooks/useHouseholdView'
import { useLibraryData } from './useLibraryData'

const NO_BOOKS = []

// Expose les livres du membre du foyer sélectionné, pris dans le cache
// partagé (LibraryDataProvider) : mes livres sont déjà là, ceux d'un autre
// membre sont demandés à la première bascule sur lui, pas avant.
export function useHouseholdBooks() {
  const { user } = useAuth()
  // null = pas de choix explicite, on regarde ses propres livres par
  // défaut. La sélection elle-même vit dans HouseholdViewProvider (partagée
  // entre Collection/Stats/Succès) pour tenir d'une page à l'autre.
  const { selectedId, setSelectedId } = useHouseholdView()
  const { owners, members, refresh: refreshOwner, ensureOwner } = useLibraryData()

  const ownerId = selectedId ?? user?.id ?? null
  const isMine = ownerId === user?.id

  useEffect(() => {
    ensureOwner(ownerId)
  }, [ensureOwner, ownerId])

  const entry = ownerId ? owners[ownerId] : undefined
  const books = entry?.books ?? NO_BOOKS
  const loading = !entry || (!entry.loaded && !entry.error)
  const error = entry?.error ?? null
  const refresh = useCallback(() => refreshOwner(ownerId), [refreshOwner, ownerId])

  return { members, ownerId, setOwnerId: setSelectedId, isMine, books, loading, error, refresh }
}
