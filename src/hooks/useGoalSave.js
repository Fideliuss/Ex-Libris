import { useState } from 'react'
import { updateReadingGoal } from '../lib/readingGoals'
import { describeError } from '../lib/errors'

// Validation + enregistrement d'un objectif de lecture annuel, avec état de
// chargement et d'erreur. save() renvoie la valeur enregistrée, ou null si
// elle est invalide ou si l'écriture a échoué (l'erreur est alors affichée
// via saveError).
export function useGoalSave() {
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  async function save(year, draft) {
    const value = Number(draft)
    if (!value || value <= 0) {
      setSaveError('Entre un nombre positif.')
      return null
    }
    setSaving(true)
    setSaveError(null)
    try {
      await updateReadingGoal(year, value)
      return value
    } catch (err) {
      setSaveError(describeError(err))
      return null
    } finally {
      setSaving(false)
    }
  }

  return { saving, saveError, setSaveError, save }
}
