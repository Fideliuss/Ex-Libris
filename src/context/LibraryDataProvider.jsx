import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { listBooks } from '../lib/books'
import { needsRefresh, removeFromList, upsertInList } from '../lib/libraryCache'
import { getMyHousehold } from '../lib/household'
import { describeError } from '../lib/errors'
import { LibraryDataContext } from '../hooks/useLibraryData'

// Référence stable : un `[]` recréé à chaque render invaliderait le useMemo.
const NO_BOOKS = []
const NO_MEMBERS = []

// Charge une seule fois, à la connexion, tous les livres visibles et les
// membres du foyer, au lieu d'un rechargement complet à chaque page
// (Collection, Stats, Succès, fiche livre...). Les mutations locales
// patchent le cache directement (upsertBook/removeBook) ; les autres cas
// passent par refresh() ou invalidate().
export function LibraryDataProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  // userId stocké avec les données : un changement de compte les rend
  // automatiquement périmées, sans les montrer au nouvel utilisateur.
  const [booksState, setBooksState] = useState({
    userId: null,
    books: [],
    error: null,
    loaded: false,
  })
  const [membersState, setMembersState] = useState({ userId: null, members: [] })
  const fetchedAt = useRef(0)
  const stale = useRef(false)

  const refresh = useCallback(async () => {
    if (!userId) return
    const books = await listBooks()
    fetchedAt.current = Date.now()
    stale.current = false
    setBooksState({ userId, books, error: null, loaded: true })
  }, [userId])

  const refreshMembers = useCallback(async () => {
    if (!userId) return
    try {
      const household = await getMyHousehold(userId)
      setMembersState({ userId, members: household.members })
    } catch {
      // Le partage reste optionnel : une erreur ici ne doit pas bloquer
      // l'affichage de la collection.
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let active = true
    listBooks()
      .then((books) => {
        if (!active) return
        fetchedAt.current = Date.now()
        stale.current = false
        setBooksState({ userId, books, error: null, loaded: true })
      })
      .catch((err) => {
        if (active) {
          setBooksState({ userId, books: [], error: describeError(err), loaded: false })
        }
      })
    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let active = true
    getMyHousehold(userId)
      .then((household) => {
        if (active) setMembersState({ userId, members: household.members })
      })
      .catch(() => {
        // Le partage reste optionnel : une erreur ici ne doit pas bloquer
        // l'affichage de la collection.
      })
    return () => {
      active = false
    }
  }, [userId])

  // Stale-while-revalidate : le cache s'affiche tout de suite, un
  // rechargement discret le remplace s'il est périmé.
  const ensureFresh = useCallback(() => {
    if (!userId) return
    if (needsRefresh({ invalidated: stale.current, fetchedAt: fetchedAt.current, now: Date.now() })) {
      refresh().catch(() => {})
    }
  }, [userId, refresh])

  const invalidate = useCallback(() => {
    stale.current = true
  }, [])

  const upsertBook = useCallback((book) => {
    setBooksState((prev) => ({ ...prev, books: upsertInList(prev.books, book) }))
  }, [])

  const removeBook = useCallback((id) => {
    setBooksState((prev) => ({ ...prev, books: removeFromList(prev.books, id) }))
  }, [])

  const mine = booksState.userId === userId
  const members = membersState.userId === userId ? membersState.members : NO_MEMBERS

  const value = useMemo(
    () => ({
      allBooks: mine ? booksState.books : NO_BOOKS,
      loading: !mine || (!booksState.loaded && !booksState.error),
      error: mine ? booksState.error : null,
      members,
      refresh,
      refreshMembers,
      ensureFresh,
      invalidate,
      upsertBook,
      removeBook,
    }),
    [mine, booksState, members, refresh, refreshMembers, ensureFresh, invalidate, upsertBook, removeBook],
  )

  return <LibraryDataContext.Provider value={value}>{children}</LibraryDataContext.Provider>
}
