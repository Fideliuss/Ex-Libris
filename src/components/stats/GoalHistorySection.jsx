import { useMemo, useState } from 'react'
import { useGoalSave } from '../../hooks/useGoalSave'
import { DEFAULT_GOAL } from '../../lib/readingGoals'
import { bookPoints, formatScore } from '../../lib/points'
import { cardClass, linkButtonClass, mutedLinkButtonClass } from '../../lib/ui'

// Une ligne par année où soit un objectif a été fixé, soit au moins un
// livre a été fini (+ l'année en cours, pour pouvoir y fixer un objectif
// même sans historique). L'objectif est indépendant par année : pas de
// valeur par défaut reportée d'une année à l'autre.
export default function GoalHistorySection({ isMine, books, readingGoals }) {
  const { goals, error: loadError, setGoal } = readingGoals

  const [editingYear, setEditingYear] = useState(null)
  const [draft, setDraft] = useState('')
  const { saving, saveError, setSaveError, save } = useGoalSave()

  const scoreByYear = useMemo(() => {
    const map = new Map()
    for (const b of books) {
      if (!b.date_finished) continue
      const year = Number(b.date_finished.slice(0, 4))
      map.set(year, (map.get(year) ?? 0) + bookPoints(b))
    }
    return map
  }, [books])

  const rows = useMemo(() => {
    if (!goals) return []
    const goalByYear = new Map(goals.map((g) => [g.year, g.goal]))
    const years = new Set(goalByYear.keys())
    for (const year of scoreByYear.keys()) years.add(year)
    years.add(new Date().getFullYear())
    return [...years]
      .sort((a, b) => b - a)
      .map((year) => ({
        year,
        goal: goalByYear.get(year) ?? null,
        score: scoreByYear.get(year) ?? 0,
      }))
  }, [goals, scoreByYear])

  function startEditing(row) {
    setEditingYear(row.year)
    setDraft(String(row.goal ?? DEFAULT_GOAL))
    setSaveError(null)
  }

  async function submit(year) {
    const value = await save(year, draft)
    if (value != null) {
      setGoal(year, value)
      setEditingYear(null)
    }
  }

  return (
    <section className={`${cardClass} p-6`}>
      <h2 className="font-serif text-lg mb-4">Historique des objectifs</h2>

      {loadError ? (
        <p role="alert" className="text-sm text-stamp">
          {loadError}
        </p>
      ) : goals == null ? (
        <p className="text-sm text-ink/70">Chargement…</p>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((row) => {
              const pct =
                row.goal != null
                  ? Math.min(100, Math.round((row.score / row.goal) * 100))
                  : null
              return (
                <li key={row.year}>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <span className="font-mono text-sm text-ink/70">
                      {row.year}
                    </span>
                    {editingYear === row.year ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          autoFocus
                          className="w-20 rounded-sm border border-ink/20 bg-surface px-2 py-0.5 text-xs text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                        />
                        <button
                          type="button"
                          onClick={() => submit(row.year)}
                          disabled={saving}
                          className={`${linkButtonClass} disabled:opacity-60`}
                        >
                          {saving ? 'Enregistrement…' : 'Valider'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingYear(null)}
                          className={mutedLinkButtonClass}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-ink/70">
                        {formatScore(row.score)}
                        {row.goal != null ? ` / ${row.goal}` : ''}
                      </span>
                    )}
                  </div>
                  {row.goal != null && (
                    <div className="h-2 w-full bg-ink/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-library rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                  {isMine && editingYear !== row.year && (
                    <button
                      type="button"
                      onClick={() => startEditing(row)}
                      className={`mt-1 ${linkButtonClass}`}
                    >
                      {row.goal != null ? 'Modifier' : "Fixer un objectif"}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          {saveError && (
            <p role="alert" className="text-xs text-stamp mt-3">
              {saveError}
            </p>
          )}
        </>
      )}
    </section>
  )
}
