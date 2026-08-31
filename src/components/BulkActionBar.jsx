import { useState } from 'react'
import { BOOK_TYPES } from '../lib/bookTypes'
import { inputClass } from '../lib/ui'
import TagMultiSelect from './TagMultiSelect'
import SuggestInput from './SuggestInput'
import EditionCheckboxes from './EditionCheckboxes'

const bulkInputClass =
  'rounded-sm border border-ink/20 bg-surface px-2 py-1.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

// Un seul champ à la fois plutôt qu'un contrôle par champ en permanence :
// avec Éditeur/Collection/Édition/Univers/Date d'achat en plus de
// Statut/Type, une barre avec tout affiché d'un coup serait illisible. Le
// contrôle de valeur change de forme selon le champ choisi (select, texte
// avec suggestions, cases à cocher, date).
const FIELDS = [
  { key: 'status', label: 'Statut', defaultValue: 'to-read' },
  { key: 'type', label: 'Type', defaultValue: 'book' },
  { key: 'publisher', label: 'Éditeur', defaultValue: '' },
  { key: 'collection', label: 'Collection', defaultValue: '' },
  { key: 'series', label: 'Série', defaultValue: '' },
  { key: 'edition', label: 'Édition', defaultValue: [] },
  { key: 'universe', label: 'Univers', defaultValue: '' },
  { key: 'purchase_date', label: "Date d'achat", defaultValue: '' },
]

export default function BulkActionBar({
  count,
  working,
  error,
  tags,
  publishers,
  collections,
  series,
  universes,
  onDelete,
  onApplyField,
  onAddTag,
  onRemoveTag,
  onCancel,
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [field, setField] = useState('status')
  const [value, setValue] = useState(FIELDS[0].defaultValue)
  const [tagDraft, setTagDraft] = useState('')
  const [tagsToRemove, setTagsToRemove] = useState([])

  const disabled = working || count === 0

  function handleFieldChange(nextField) {
    setField(nextField)
    setValue(FIELDS.find((f) => f.key === nextField).defaultValue)
  }

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
                className="text-sm px-3 py-1.5 rounded-sm border border-ink/20 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={disabled}
                className="text-sm px-3 py-1.5 rounded-sm bg-stamp-fill text-white hover:bg-stamp-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
              >
                Confirmer
              </button>
            </div>
          </div>
        ) : (
          <>
          <div className="flex flex-wrap items-start gap-2">
            <select
              value={field}
              onChange={(e) => handleFieldChange(e.target.value)}
              aria-label="Champ à modifier"
              className={bulkInputClass}
            >
              {FIELDS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>

            <div className="min-w-[10rem]">
              {field === 'status' && (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-label="Nouveau statut"
                  className={bulkInputClass}
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="to-read">À lire</option>
                  <option value="reading">En cours</option>
                  <option value="read">Lu</option>
                </select>
              )}
              {field === 'type' && (
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-label="Nouveau type"
                  className={bulkInputClass}
                >
                  {Object.entries(BOOK_TYPES).map(([v, label]) => (
                    <option key={v} value={v}>
                      {label}
                    </option>
                  ))}
                </select>
              )}
              {field === 'publisher' && (
                <SuggestInput
                  value={value}
                  onChange={setValue}
                  suggestions={publishers}
                  className={inputClass}
                />
              )}
              {field === 'collection' && (
                <SuggestInput
                  value={value}
                  onChange={setValue}
                  suggestions={collections}
                  className={inputClass}
                />
              )}
              {field === 'series' && (
                <SuggestInput
                  value={value}
                  onChange={setValue}
                  suggestions={series}
                  className={inputClass}
                />
              )}
              {field === 'universe' && (
                <SuggestInput
                  value={value}
                  onChange={setValue}
                  suggestions={universes}
                  className={inputClass}
                />
              )}
              {field === 'purchase_date' && (
                <input
                  type="date"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-label="Nouvelle date d'achat"
                  className={bulkInputClass}
                />
              )}
              {field === 'edition' && (
                <EditionCheckboxes value={value} onChange={setValue} />
              )}
            </div>

            <button
              type="button"
              onClick={() => onApplyField(field, value)}
              disabled={disabled}
              className="text-sm px-3 py-1.5 rounded-sm border border-library text-library hover:bg-library-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60"
            >
              Appliquer
            </button>

            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={disabled}
              className="text-sm px-3 py-1.5 rounded-sm border border-stamp/40 text-stamp hover:bg-stamp-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
            >
              Supprimer
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="ml-auto text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Fermer
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
            <input
              type="text"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="Ajouter un tag…"
              aria-label="Tag à ajouter"
              className="rounded-sm border border-ink/20 bg-surface px-2 py-1.5 text-sm w-36 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            />
            <button
              type="button"
              onClick={() => {
                onAddTag(tagDraft)
                setTagDraft('')
              }}
              disabled={disabled || !tagDraft.trim()}
              className="text-sm px-3 py-1.5 rounded-sm border border-library text-library hover:bg-library-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60"
            >
              Ajouter le tag
            </button>
          </div>

          {tags?.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <TagMultiSelect
                tags={tags}
                selected={tagsToRemove}
                onChange={setTagsToRemove}
                label="Retirer :"
              />
              <button
                type="button"
                onClick={() => {
                  onRemoveTag(tagsToRemove)
                  setTagsToRemove([])
                }}
                disabled={disabled || tagsToRemove.length === 0}
                className="text-sm px-3 py-1.5 rounded-sm border border-stamp/40 text-stamp hover:bg-stamp-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
              >
                Retirer le{tagsToRemove.length > 1 ? 's' : ''} tag{tagsToRemove.length > 1 ? 's' : ''}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}
