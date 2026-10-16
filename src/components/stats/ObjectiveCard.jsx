import { useState } from 'react'
import { useGoalSave } from '../../hooks/useGoalSave'
import { DEFAULT_GOAL } from '../../lib/readingGoals'
import { formatScore } from '../../lib/points'
import { linkButtonClass, mutedLinkButtonClass } from '../../lib/ui'

export default function ObjectiveCard({ isMine, score, breakdown, readingGoals }) {
  const { goals, error: loadError, setGoal } = readingGoals
  const year = new Date().getFullYear()
  // Pas de ligne pour l'année en cours : objectif par défaut, comme
  // getReadingGoal() le faisait.
  const goal = goals ? (goals.find((g) => g.year === year)?.goal ?? DEFAULT_GOAL) : null

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const { saving, saveError, setSaveError, save } = useGoalSave()

  function startEditing() {
    setDraft(String(goal ?? DEFAULT_GOAL))
    setEditing(true)
    setSaveError(null)
  }

  async function submit() {
    const value = await save(year, draft)
    if (value != null) {
      setGoal(year, value)
      setEditing(false)
    }
  }

  const pct = goal ? Math.min(100, Math.round((score / goal) * 100)) : 0

  return (
    <section className="bg-card border-t-4 border-dashed border-library rounded-sm shadow-sm p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-serif text-lg">Objectif de lecture {year}</h2>
        {isMine && !editing && goal != null && (
          <button
            type="button"
            onClick={startEditing}
            className={linkButtonClass}
          >
            Modifier l'objectif
          </button>
        )}
      </div>

      {loadError ? (
        <p role="alert" className="text-sm text-stamp">
          {loadError}
        </p>
      ) : goal == null ? (
        <p className="text-sm text-ink/70">Chargement…</p>
      ) : editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            step="0.5"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-24 rounded-sm border border-ink/20 bg-surface px-2 py-1 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={`${linkButtonClass} disabled:opacity-60`}
          >
            {saving ? 'Enregistrement…' : 'Valider'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className={mutedLinkButtonClass}
          >
            Annuler
          </button>
        </div>
      ) : (
        <>
          <p className="font-mono text-3xl font-semibold text-library">
            {formatScore(score)}
            <span className="text-lg text-ink/70 font-normal"> / {goal}</span>
          </p>
          <div className="h-3 w-full rounded-full bg-ink/5 overflow-hidden mt-3">
            <div
              className="h-full bg-library rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-ink/70 mt-2">
            {pct}% de l'objectif · 1 livre = 1 pt, BD/Comics = 0,5 pt, Manga =
            1/3 pt
          </p>
          {breakdown.length > 0 && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-ink/70">
              {breakdown.map((entry) => (
                <li key={entry.key}>
                  {entry.count} {entry.label.toLowerCase()}
                  {entry.count > 1 && !['bd', 'comics'].includes(entry.key) && 's'}{' '}
                  · {formatScore(entry.points)} pt
                  {entry.points > 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {saveError && (
        <p role="alert" className="text-xs text-stamp mt-2">
          {saveError}
        </p>
      )}
    </section>
  )
}
