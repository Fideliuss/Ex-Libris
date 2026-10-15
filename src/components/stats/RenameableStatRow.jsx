import { useState } from 'react'
import { describeError } from '../../lib/errors'
import { linkButtonClass, mutedLinkButtonClass } from '../../lib/ui'
import CountBar from './CountBar'

export default function RenameableStatRow({
  name,
  count,
  max,
  colorClass,
  existingNames,
  onRename,
  onRenamed,
  isMine,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [confirmingMerge, setConfirmingMerge] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  const trimmed = draft.trim()
  const collidingName = existingNames.find(
    (n) => n !== name && n.toLowerCase() === trimmed.toLowerCase(),
  )

  function startEditing() {
    setDraft(name)
    setEditing(true)
    setConfirmingMerge(false)
    setError(null)
  }

  function cancel() {
    setEditing(false)
    setConfirmingMerge(false)
    setError(null)
  }

  async function submit() {
    if (!trimmed || trimmed === name) {
      cancel()
      return
    }
    if (collidingName && !confirmingMerge) {
      setConfirmingMerge(true)
      return
    }
    setWorking(true)
    setError(null)
    try {
      await onRename(name, trimmed)
      await onRenamed()
      setEditing(false)
      setConfirmingMerge(false)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setWorking(false)
    }
  }

  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        {editing ? (
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setConfirmingMerge(false)
            }}
            autoFocus
            className="text-sm border-b border-ink/30 bg-transparent focus:outline-none focus:border-library flex-1 min-w-0"
          />
        ) : (
          <span className="text-sm truncate">{name}</span>
        )}
        <span className="font-mono text-xs text-ink/70 shrink-0">{count}</span>
      </div>
      <CountBar count={count} max={max} colorClass={colorClass} />
      {editing ? (
        <div className="mt-1 space-y-1">
          {confirmingMerge && (
            <p className="text-xs text-stamp">
              « {collidingName} » existe déjà : les livres seront regroupés
              ensemble. Confirmer ?
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-stamp">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={working}
              className={`${linkButtonClass} disabled:opacity-60`}
            >
              {working
                ? 'Renommage…'
                : confirmingMerge
                  ? 'Confirmer la fusion'
                  : 'Valider'}
            </button>
            <button
              type="button"
              onClick={cancel}
              className={mutedLinkButtonClass}
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        isMine && (
          <button
            type="button"
            onClick={startEditing}
            className={`mt-1 ${linkButtonClass}`}
          >
            Renommer
          </button>
        )
      )}
    </li>
  )
}
