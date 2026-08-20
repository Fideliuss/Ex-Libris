import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listBooks } from '../lib/books'
import { getPartner } from '../lib/household'

// Charge tous les livres visibles (les miens + ceux du partenaire, autorisés
// par la RLS), puis expose une bascule "mine" / "partner" pour filtrer côté
// client sans refaire de requête à chaque changement d'onglet.
export function useHouseholdBooks() {
  const { user } = useAuth()
  const partner = getPartner(user?.id)
  const [view, setView] = useState('mine') // 'mine' | 'partner'
  const [allBooks, setAllBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    listBooks()
      .then((data) => {
        if (active) setAllBooks(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
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

  const isMine = view === 'mine'
  const ownerId = isMine ? user?.id : partner?.id
  const books = useMemo(
    () => allBooks.filter((b) => b.user_id === ownerId),
    [allBooks, ownerId],
  )

  return { partner, view, setView, isMine, books, loading, error, refresh }
}
