import { useState } from 'react'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function LetterButton({ letter, available, active, onClick }) {
  return (
    <button
      type="button"
      disabled={!available}
      onClick={onClick}
      aria-current={active ? 'true' : undefined}
      aria-label={`Aller à ${letter}`}
      className={`flex h-5 w-6 items-center justify-center rounded-full text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
        active
          ? 'bg-library-fill text-white'
          : available
            ? 'text-ink/80 hover:bg-library-fill hover:text-white cursor-pointer'
            : 'text-ink/20 cursor-default'
      }`}
    >
      {letter}
    </button>
  )
}

// Rail façon "carnet d'adresses" pour sauter directement à une lettre du
// classement alphabétique en cours (tri Titre/Auteur uniquement, seul cas où
// les en-têtes de groupe sont de simples lettres). Les lettres absentes de
// la collection restent affichées mais désactivées, plutôt que masquées :
// la grille A-Z garde une forme stable, plus facile à viser au clic/doigt.
// Centré verticalement plutôt qu'ancré en haut : la zone d'en-tête
// (filtres, chips de statut...) a une hauteur variable, un ancrage fixe en
// haut se serait retrouvé à chevaucher ce bloc selon ce qui est déplié.
//
// Le rail complet passe bien sur desktop mais prend trop de place sur
// mobile : en dessous de `sm`, il reste replié en une petite poignée "A-Z"
// et ne se déploie qu'au tap, pour ne rien occuper tant qu'on ne s'en sert
// pas. Se referme automatiquement après avoir choisi une lettre.
export default function AlphabetIndex({ availableLetters, activeLetter, onSelect }) {
  const [expanded, setExpanded] = useState(false)

  function handleSelect(letter) {
    onSelect(letter)
    setExpanded(false)
  }

  return (
    <>
      <nav
        aria-label="Aller à la lettre"
        className="fixed right-2 top-1/2 z-20 hidden max-h-[80vh] -translate-y-1/2 flex-col items-center gap-px overflow-y-auto rounded-full border border-ink/10 bg-card px-1.5 py-3 shadow-md sm:flex"
      >
        {LETTERS.map((letter) => (
          <LetterButton
            key={letter}
            letter={letter}
            available={availableLetters.has(letter)}
            active={availableLetters.has(letter) && letter === activeLetter}
            onClick={() => onSelect(letter)}
          />
        ))}
      </nav>

      <div className="sm:hidden">
        {expanded ? (
          <nav
            aria-label="Aller à la lettre"
            className="fixed right-2 top-1/2 z-20 flex max-h-[70vh] -translate-y-1/2 flex-col items-center gap-px overflow-y-auto rounded-full border border-ink/10 bg-card px-1.5 py-2 shadow-md"
          >
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Fermer l'index alphabétique"
              className="mb-1 flex h-5 w-6 items-center justify-center rounded-full text-sm text-ink/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              ×
            </button>
            {LETTERS.map((letter) => (
              <LetterButton
                key={letter}
                letter={letter}
                available={availableLetters.has(letter)}
                active={availableLetters.has(letter) && letter === activeLetter}
                onClick={() => handleSelect(letter)}
              />
            ))}
          </nav>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Ouvrir l'index alphabétique"
            className="fixed right-1 top-1/2 z-20 -translate-y-1/2 rounded-full border border-ink/10 bg-card px-1 py-2 text-center font-mono text-[10px] font-semibold leading-tight text-ink/60 shadow-md"
          >
            A
            <br />-<br />Z
          </button>
        )}
      </div>
    </>
  )
}
