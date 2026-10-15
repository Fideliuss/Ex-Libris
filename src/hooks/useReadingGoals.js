import { useCallback, useEffect, useState } from 'react'
import { getReadingGoalHistory } from '../lib/readingGoals'
import { describeError } from '../lib/errors'

// Historique des objectifs de lecture d'un utilisateur, chargé UNE fois pour
// la page (la carte "Objectif" et l'historique s'en servent toutes les deux,
// au lieu de deux requêtes). Le userId est gardé avec le résultat : si on
// bascule sur un autre membre du foyer avant que la requête ne revienne, ce
// résultat est périmé et on retombe sur l'état de chargement.
export function useReadingGoals(userId) {
  const [result, setResult] = useState({ userId: null, goals: null, error: null })

  useEffect(() => {
    if (!userId) return
    let active = true
    getReadingGoalHistory(userId)
      .then((goals) => {
        if (active) setResult({ userId, goals, error: null })
      })
      .catch((err) => {
        if (active) setResult({ userId, goals: null, error: describeError(err) })
      })
    return () => {
      active = false
    }
  }, [userId])

  // Après un enregistrement réussi : met à jour la liste locale sans
  // rechargement.
  const setGoal = useCallback(
    (year, goal) => {
      setResult((prev) => ({
        userId,
        error: null,
        goals: [...(prev.goals ?? []).filter((g) => g.year !== year), { year, goal }],
      }))
    },
    [userId],
  )

  const stale = result.userId !== userId
  return {
    goals: stale ? null : result.goals,
    error: stale ? null : result.error,
    setGoal,
  }
}
