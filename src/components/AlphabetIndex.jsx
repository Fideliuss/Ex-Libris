const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Rail façon "carnet d'adresses" pour sauter directement à une lettre du
// classement alphabétique en cours (tri Titre/Auteur uniquement, seul cas où
// les en-têtes de groupe sont de simples lettres). Les lettres absentes de
// la collection restent affichées mais désactivées, plutôt que masquées :
// la grille A-Z garde une forme stable, plus facile à viser au clic/doigt.
export default function AlphabetIndex({ availableLetters, onSelect }) {
  return (
    <nav
      aria-label="Aller à la lettre"
      className="fixed right-1 top-28 z-20 flex flex-col items-center rounded-sm bg-card/80 py-1 shadow-sm"
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
            className={`w-4 text-center font-mono text-[9px] leading-[13px] rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-library ${
              available
                ? 'text-ink/70 hover:text-library hover:font-bold cursor-pointer'
                : 'text-ink/15 cursor-default'
            }`}
          >
            {letter}
          </button>
        )
      })}
    </nav>
  )
}
