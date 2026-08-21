import { useState } from 'react'
import { BOOK_TYPES } from '../lib/bookTypes'

export default function BulkActionBar({
  count,
  working,
  error,
  tags,
  onDelete,
  onChangeStatus,
  onChangeType,
  onAddTag,
  onRemoveTag,
  onCancel,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [statusToApply, setStatusToApply] = useState('to-read')
  const [typeToApply, setTypeToApply] = useState('book')
  const [tagDraft, setTagDraft] = useState('')
  const [tagToRemove, setTagToRemove] = useState('')

  const disabled = working || count === 0

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-ink/15 shadow-lg">
      <div className="max-w-5xl mx-auto p-4 space-y-3">
        {error && (
          <p role="alert" className="text-sm text-stamp">
            {error}
          </p>
        )}

        {confirmingDelete ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-stamp">
              Supprimer définitivement {count} livre{count > 1 ? 's' : ''} ?
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-sm px-3 py-1.5 rounded-sm border border-ink/20 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={disabled}
                className="text-sm px-3 py-1.5 rounded-sm bg-stamp text-white hover:bg-stamp/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
              >
                Confirmer
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusToApply}
              onChange={(e) => setStatusToApply(e.target.value)}
              aria-label="Nouveau statut"
              className="rounded-sm border border-ink/20 bg-white px-2 py-1.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              <option value="wishlist">Souhaité</option>
              <option value="to-read">À lire</option>
              <option value="reading">En cours</option>
              <option value="read">Lu</option>
            </select>
            <button
              type="button"
              onClick={() => onChangeStatus(statusToApply)}
              disabled={disabled}
              className="text-sm px-3 py-1.5 rounded-sm border border-library text-library hover:bg-library hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60"
            >
              Appliquer le statut
            </button>

            <select
              value={typeToApply}
              onChange={(e) => setTypeToApply(e.target.value)}
              aria-label="Nouveau type"
              className="rounded-sm border border-ink/20 bg-white px-2 py-1.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              {Object.entries(BOOK_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onChangeType(typeToApply)}
              disabled={disabled}
              className="text-sm px-3 py-1.5 rounded-sm border border-library text-library hover:bg-library hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60"
            >
              Appliquer le type
            </button>

            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="Ajouter un tag…"
              aria-label="Tag à ajouter"
              className="rounded-sm border border-ink/20 bg-white px-2 py-1.5 text-sm w-36 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            />
            <button
              type="button"
              onClick={() => {
                onAddTag(tagDraft)
                setTagDraft('')
              }}
              disabled={disabled || !tagDraft.trim()}
              className="text-sm px-3 py-1.5 rounded-sm border border-library text-library hover:bg-library hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60"
            >
              Ajouter le tag
            </button>

            {tags?.length > 0 && (
              <>
                <select
                  value={tagToRemove}
                  onChange={(e) => setTagToRemove(e.target.value)}
                  aria-label="Tag à retirer"
                  className="rounded-sm border border-ink/20 bg-white px-2 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                >
                  <option value="">Retirer un tag…</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    onRemoveTag(tagToRemove)
                    setTagToRemove('')
                  }}
                  disabled={disabled || !tagToRemove}
                  className="text-sm px-3 py-1.5 rounded-sm border border-stamp/40 text-stamp hover:bg-stamp hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
                >
                  Retirer le tag
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={disabled}
              className="text-sm px-3 py-1.5 rounded-sm border border-stamp/40 text-stamp hover:bg-stamp hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
            >
              Supprimer
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="ml-auto text-sm text-ink/50 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
