import { dangerButtonClass } from '../lib/ui'

// Barre de confirmation "Annuler / Confirmer" en ligne (pas de modal) :
// même forme utilisée pour confirmer une suppression sur la fiche livre
// (BookForm) et en sélection multiple (BulkActionBar). `wrapped` ajoute
// l'encart bordé utilisé quand le bouton "Supprimer" qui la déclenche est
// dans un formulaire plutôt que déjà dans une barre dédiée.
export default function InlineConfirm({ message, onCancel, onConfirm, disabled, wrapped }) {
  const content = (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-stamp">{message}</p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded-sm border border-ink/20 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`text-sm px-3 py-1.5 rounded-sm ${dangerButtonClass}`}
        >
          Confirmer
        </button>
      </div>
    </div>
  )

  if (!wrapped) return content
  return <div className="border border-stamp/40 bg-stamp/5 rounded-sm p-4">{content}</div>
}
