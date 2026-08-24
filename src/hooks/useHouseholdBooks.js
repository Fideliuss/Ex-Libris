import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listBooks } from '../lib/books'
import { getAcceptedPartner } from '../lib/friendCode'
import { describeError } from '../lib/errors'

// Charge tous les livres visibles (les miens + ceux du partenaire, autorisés
// par la RLS), puis expose une bascule "mine" / "partner" pour filtrer côté
// client sans refaire de requête à chaque changement d'onglet.
export function useHouseholdBooks() {
  const { user } = useAuth()
  const [partner, setPartner] = useState(null)
  const [view, setView] = useState('mine') // 'mine' | 'partner'
  const [allBooks, setAllBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    let active = true
    getAcceptedPartner(user.id)
      .then((p) => {
        if (active) setPartner(p)
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

  const isMine = view === 'mine'
  const ownerId = isMine ? user?.id : partner?.id
  const books = useMemo(
    () => allBooks.filter((b) => b.user_id === ownerId),
    [allBooks, ownerId],
  )

  return { partner, view, setView, isMine, books, loading, error, refresh }
}
