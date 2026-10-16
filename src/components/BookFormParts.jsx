import { useState } from 'react'
import BookCardVisual from './BookCardVisual'
import { STATUS_BORDER_CLASS } from '../lib/statusLabels'
import { prefersReducedMotion } from '../lib/motion'
import { primaryButtonClass } from '../lib/ui'

// Aperçu "façon carte de la collection" (D1 angle C, partie 2 de la fiche
// de chantier) : retour visuel immédiat sur ce qui sera enregistré, mis à
// jour en direct pendant la saisie (avant même le premier scan ISBN).
export function LivePreviewCard({ book, saving, isEdit }) {
  // BookCardVisual attend un titre pour afficher une ligne correcte : un
  // champ vide donnerait un <p> vide plutôt qu'un vrai placeholder, d'où le
  // fallback local (comportement propre à cet aperçu, pas à la vraie carte).
  const previewBook = { ...book, title: book.title || 'Titre à renseigner' }
  return (
    // Collée à droite du formulaire (colonne sticky, même pattern que la
    // barre latérale de /account) plutôt qu'insérée dans le flux du
    // formulaire (encombrant sur un long formulaire vertical) ou un simple
    // fixed calé sur le viewport (se détache visuellement du formulaire sur
    // un écran large). Réservée au desktop : pas de place à côté du
    // formulaire sur un écran étroit.
    <div className="hidden lg:block lg:w-44 lg:shrink-0 lg:sticky lg:top-24">
      <p className="font-mono text-xs tracking-widest text-library uppercase mb-2">
        Aperçu
      </p>
      <div
        className={`relative bg-card border-t-4 border-dashed rounded-sm shadow-lg overflow-hidden ${STATUS_BORDER_CLASS[book.status]}`}
      >
        <BookCardVisual book={previewBook} />
      </div>

      {/* En plus du bouton en bas du formulaire (utile sur un long
          formulaire, pour ne pas avoir à redescendre) : soumet le <form>
          via l'attribut form (bouton hors de l'arbre du formulaire). */}
      <button
        type="submit"
        form="book-form"
        disabled={saving}
        className={`w-full mt-3 rounded-sm py-2 text-sm ${primaryButtonClass}`}
      >
        {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
      </button>
    </div>
  )
}

// Case à cocher personnalisée plutôt qu'une <input type="checkbox"> nue
// (comme EditionCheckboxes) : c'est le seul contrôle du formulaire pensé
// pour un geste rapide en librairie, donc volontairement plus visible que
// les champs habituels. L'input réel reste dans le DOM (sr-only) pour le
// clavier/lecteur d'écran ; le carré coché et le focus visible sont gérés
// à la main par-dessus.
export function WishlistCheckbox({ checked, onChange }) {
  return (
    <label
      className={`flex items-center gap-3 rounded-sm border-2 border-dashed p-3 cursor-pointer transition-colors ${
        checked
          ? 'border-wishlist bg-wishlist/10'
          : 'border-ink/20 hover:border-wishlist/50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden="true"
        className={`shrink-0 w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-library peer-focus-visible:ring-offset-2 ${
          checked
            ? 'bg-wishlist-fill border-wishlist-fill'
            : 'border-ink/30 bg-surface'
        }`}
      >
        {checked && (
          <svg
            viewBox="0 0 20 20"
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 10l4 4 8-8" />
          </svg>
        )}
      </span>
      <span className="text-sm">
        <span className="font-medium">Je le veux</span>
        <span className="text-ink/70"> (Wishlist)</span>
      </span>
    </label>
  )
}

export function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-stamp"> *</span>}
      </span>
      {children}
    </label>
  )
}

// Section repliable pour regrouper les champs secondaires (formulaire
// d'ajout/édition, "Angle C" de la fiche de chantier D1) : ISBN/Titre/Type
// restent toujours visibles hors section, le reste se range par thème pour
// réduire la densité visuelle sans rien cacher définitivement.
export function FormSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  // grid-template-rows en classe Tailwind (grid-rows-[0fr]/[1fr]) ne se
  // recalculait pas de façon fiable au toggle dans les tests : la même
  // propriété posée en style inline fonctionne correctement, donc on passe
  // par là plutôt que par une classe pour cette propriété précise.
  const reduceMotion = prefersReducedMotion()
  return (
    <div className="border-t border-ink/10 pt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
      >
        <span className="font-serif text-lg font-semibold">{title}</span>
        <span aria-hidden="true" className="text-ink/70">
          {open ? '▴' : '▾'}
        </span>
      </button>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: reduceMotion ? 'none' : 'grid-template-rows 300ms ease-out',
        }}
      >
        {/* -mx-1/px-1 : l'anneau de focus d'un champ (voir inputClass)
            déborde de 1px hors de sa boîte ; sans cette marge de respiration,
            ce conteneur (nécessairement overflow-hidden pour l'animation
            d'ouverture/fermeture ci-dessus) le coupait net sur les côtés,
            visible uniquement ici puisque Titre/Type restent hors section.
            Le -mx-1 fait déborder la zone de découpe elle-même plutôt que de
            décaler les champs, qui restent alignés avec Titre/Type. */}
        <div className="-mx-1 overflow-hidden" inert={!open}>
          <div className="space-y-5 px-1 pt-4 pb-1">{children}</div>
        </div>
      </div>
    </div>
  )
}

