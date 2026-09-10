const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Rail façon "carnet d'adresses" pour sauter directement à une lettre du
// classement alphabétique en cours (tri Titre/Auteur uniquement, seul cas où
// les en-têtes de groupe sont de simples lettres). Les lettres absentes de
// la collection restent affichées mais désactivées, plutôt que masquées :
// la grille A-Z garde une forme stable, plus facile à viser au clic/doigt.
// Centré verticalement plutôt qu'ancré en haut : la zone d'en-tête
// (filtres, chips de statut...) a une hauteur variable, un ancrage fixe en
// haut se serait retrouvé à chevaucher ce bloc selon ce qui est déplié.
export default function AlphabetIndex({ availableLetters, onSelect }) {
  return (
    <nav
      aria-label="Aller à la lettre"
      className="fixed right-2 top-1/2 z-20 flex max-h-[80vh] -translate-y-1/2 flex-col items-center gap-px overflow-y-auto rounded-full border border-ink/10 bg-card px-1.5 py-3 shadow-md"
    >
      {LETTERS.map((letter) => {
        const available = availableLetters.has(letter)
        return (
          <button
            key={letter}
            type="button"
            disabled={!available}
            onClick={() => onSelect(letter)}
            aria-label={`Aller à ${letter}`}
            className={`flex h-5 w-6 items-center justify-center rounded-full text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
              available
                ? 'text-ink/80 hover:bg-library-fill hover:text-white cursor-pointer'
                : 'text-ink/20 cursor-default'
            }`}
          >
            {letter}
          </button>
        )
      })}
    </nav>
  )
}
