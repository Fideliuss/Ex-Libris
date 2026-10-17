import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { listBooks } from '../lib/books'
import { removeFromList, shouldLoadOwner, upsertInList } from '../lib/libraryCache'
import { getMyHousehold } from '../lib/household'
import { describeError } from '../lib/errors'
import { LibraryDataContext } from '../hooks/useLibraryData'

// Références stables : un `[]` ou `{}` recréé à chaque render invaliderait
// les useMemo qui en dépendent.
const NO_MEMBERS = []
const NO_OWNERS = {}

// Garde les livres par propriétaire (moi, puis chaque membre du foyer à la
// demande) au lieu de tout télécharger d'un coup : mes livres arrivent à la
// connexion, ceux d'un autre membre seulement quand on bascule sur lui. Les
// mutations locales patchent le cache directement (upsertBook/removeBook) ;
// les autres cas passent par refresh() ou invalidate().
export function LibraryDataProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  // userId stocké avec les données : un changement de compte les rend
  // automatiquement périmées, sans les montrer au nouvel utilisateur.
  // owners[ownerId] = { books, fetchedAt, loaded, error }.
  const [booksState, setBooksState] = useState({ userId: null, owners: NO_OWNERS })
  const [membersState, setMembersState] = useState({ userId: null, members: [] })
  // Copie lisible hors rendu (ensureOwner ne doit pas changer d'identité à
  // chaque chargement). Un effet de mise en page passe avant les effets des
  // composants enfants, qui lisent donc toujours l'état à jour.
  const stateRef = useRef(booksState)
  useLayoutEffect(() => {
    stateRef.current = booksState
  }, [booksState])
  // Un seul téléchargement par propriétaire à la fois : un second appel
  // pendant que le premier court reçoit la même promesse au lieu de relancer
  // la requête.
  const inFlight = useRef(new Map())
  // Propriétaires dont une réponse a été jetée (voir load) : à recharger à la
  // prochaine demande même si leur cache est récent.
  const staleOwners = useRef(new Set())
  // Nombre de modifications locales (upsertBook/removeBook) depuis le début de
  // la session : sert à repérer un rechargement parti AVANT une modification
  // et revenu APRÈS, dont la réponse périmée écraserait cette modification.
  const localEdits = useRef(0)

  const load = useCallback(
    (ownerId) => {
      if (!userId || !ownerId) return Promise.resolve()
      const key = `${userId}:${ownerId}`
      const running = inFlight.current.get(key)
      if (running) return running

      const editsAtStart = localEdits.current
      const request = listBooks({ userId: ownerId })
        .then(
          (books) => {
            if (localEdits.current !== editsAtStart) {
              // Réponse périmée : on la jette et on recharge à la prochaine demande.
              staleOwners.current.add(ownerId)
              return
            }
            staleOwners.current.delete(ownerId)
            setBooksState((prev) => ({
              userId,
              owners: {
                ...(prev.userId === userId ? prev.owners : NO_OWNERS),
                [ownerId]: { books, fetchedAt: Date.now(), loaded: true, error: null },
              },
            }))
          },
          (err) => {
            // Une erreur sur un cache déjà chargé le laisse intact (l'appelant
            // la reçoit) ; sans cache, la page doit pouvoir l'afficher.
            setBooksState((prev) => {
              const owners = prev.userId === userId ? prev.owners : NO_OWNERS
              if (owners[ownerId]?.loaded) return prev
              return {
                userId,
                owners: {
                  ...owners,
                  [ownerId]: { books: [], fetchedAt: 0, loaded: false, error: describeError(err) },
                },
              }
            })
            throw err
          },
        )
        .finally(() => inFlight.current.delete(key))
      inFlight.current.set(key, request)
      return request
    },
    [userId],
  )

  // Recharge les livres d'un propriétaire (les miens par défaut). L'appelant
  // reçoit l'erreur éventuelle.
  const refresh = useCallback((ownerId = userId) => load(ownerId), [userId, load])

  // Stale-while-revalidate : le cache s'affiche tout de suite, un
  // rechargement discret le remplace s'il est périmé ou s'il n'existe pas
  // encore (première bascule sur un membre du foyer).
  const ensureOwner = useCallback(
    (ownerId) => {
      if (!userId || !ownerId) return
      const current = stateRef.current
      const entry = current.userId === userId ? current.owners[ownerId] : undefined
      if (
        shouldLoadOwner({
          entry,
          isMine: ownerId === userId,
          invalidated: staleOwners.current.has(ownerId),
          now: Date.now(),
        })
      ) {
        load(ownerId).catch(() => {})
      }
    },
    [userId, load],
  )

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

  // Mes livres dès la connexion, pour les pages qui ne passent pas par
  // useHouseholdBooks (formulaire d'ajout, par exemple).
  useEffect(() => {
    ensureOwner(userId)
  }, [userId, ensureOwner])

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

  // Le foyer a changé (invitation acceptée, membre retiré...) : les livres
  // gardés pour les autres membres ne sont peut-être plus visibles. On les
  // oublie, ils seront redemandés à la prochaine bascule. Mes livres, eux, ne
  // changent pas avec le foyer.
  const invalidate = useCallback(() => {
    staleOwners.current.clear()
    setBooksState((prev) => {
      const mine = prev.owners[prev.userId]
      return { userId: prev.userId, owners: mine ? { [prev.userId]: mine } : NO_OWNERS }
    })
  }, [])

  const upsertBook = useCallback((book) => {
    localEdits.current += 1
    setBooksState((prev) => {
      const entry = prev.owners[book.user_id]
      // Le livre d'un propriétaire dont on n'a rien chargé arrivera avec son
      // chargement.
      if (!entry) return prev
      return {
        ...prev,
        owners: { ...prev.owners, [book.user_id]: { ...entry, books: upsertInList(entry.books, book) } },
      }
    })
  }, [])

  const removeBook = useCallback((id) => {
    localEdits.current += 1
    setBooksState((prev) => ({
      ...prev,
      owners: Object.fromEntries(
        Object.entries(prev.owners).map(([ownerId, entry]) => [
          ownerId,
          { ...entry, books: removeFromList(entry.books, id) },
        ]),
      ),
    }))
  }, [])

  const owners = booksState.userId === userId ? booksState.owners : NO_OWNERS
  const members = membersState.userId === userId ? membersState.members : NO_MEMBERS
  // Tous les livres chargés jusqu'ici (moi, plus les membres déjà consultés).
  const allBooks = useMemo(() => Object.values(owners).flatMap((entry) => entry.books), [owners])

  const value = useMemo(
    () => ({
      owners,
      allBooks,
      members,
      refresh,
      refreshMembers,
      ensureOwner,
      invalidate,
      upsertBook,
      removeBook,
    }),
    [owners, allBooks, members, refresh, refreshMembers, ensureOwner, invalidate, upsertBook, removeBook],
  )

  return <LibraryDataContext.Provider value={value}>{children}</LibraryDataContext.Provider>
}
