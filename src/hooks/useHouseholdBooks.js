import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listBooks } from '../lib/books'
import { getMyHousehold } from '../lib/household'
import { describeError } from '../lib/errors'

// Charge tous les livres visibles (les miens + ceux des membres du foyer,
// autorisés par la RLS), puis expose une bascule sur l'un d'eux pour
// filtrer côté client sans refaire de requête à chaque changement.
export function useHouseholdBooks() {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  // null = pas de choix explicite, on regarde ses propres livres par
  // défaut ; évite d'avoir à synchroniser ownerId sur user.id dans un
  // effet (user n'est pas connu tout de suite au montage).
  const [selectedId, setSelectedId] = useState(null)
  const [allBooks, setAllBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    let active = true
    getMyHousehold(user.id)
      .then((h) => {
        if (active) setMembers(h.members)
      })
      .catch(() => {
        // Le partage reste optionnel : une erreur ici ne doit pas bloquer
        // l'affichage de la collection.
      })
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    let active = true
    listBooks()
      .then((data) => {
        if (active) setAllBooks(data)
      })
      .catch((err) => {
        if (active) setError(describeError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function refresh() {
    setAllBooks(await listBooks())
  }

  const ownerId = selectedId ?? user?.id ?? null
  const isMine = ownerId === user?.id
  const books = useMemo(
    () => allBooks.filter((b) => b.user_id === ownerId),
    [allBooks, ownerId],
  )

  return { members, ownerId, setOwnerId: setSelectedId, isMine, books, loading, error, refresh }
}
