import { useCallback, useEffect, useState } from 'react'
import { STATUS_BADGE_CLASS, STATUS_LABELS } from '../lib/statusLabels'
import BookCoverPlaceholder from './BookCoverPlaceholder'

const TOTAL_STEPS = 5

// Fond décoratif : colonnes de vraies couvertures (même composant que
// partout ailleurs dans l'app) qui défilent en boucle continue derrière le
// modal (pas de scroll réel dans un modal, donc pas le même mécanisme que le
// mur de couvertures de la landing). Chaque colonne a sa propre durée/sens,
// posés en style inline (voir le commentaire sur les keyframes dans
// index.css pour pourquoi pas une classe Tailwind).
const SAMPLE_BOOKS = [
  { title: 'Fondation', author: 'Isaac Asimov' },
  { title: 'Dune', author: 'Frank Herbert' },
  { title: '1984', author: 'George Orwell' },
  { title: 'Sapiens', author: 'Yuval Noah Harari' },
  { title: "L'Étranger", author: 'Albert Camus' },
  { title: 'Les Misérables', author: 'Victor Hugo' },
  { title: 'Le Petit Prince', author: 'A. de Saint-Exupéry' },
  { title: 'One Piece', author: 'Eiichiro Oda', volume: 42 },
  { title: 'Naruto', author: 'Masashi Kishimoto', volume: 7 },
  { title: 'Watchmen', author: 'Alan Moore' },
]
const COLUMN_BOOK_COUNT = 5
const COLUMNS = [
  { duration: 36, direction: 'up', offset: 0 },
  { duration: 44, direction: 'down', offset: 3 },
  { duration: 30, direction: 'up', offset: 6 },
  { duration: 40, direction: 'down', offset: 8 },
]

function CoverColumn({ duration, direction, offset }) {
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const books = [...Array(COLUMN_BOOK_COUNT)].map(
    (_, i) => SAMPLE_BOOKS[(i + offset) % SAMPLE_BOOKS.length],
  )
  const doubled = [...books, ...books]
  return (
    <div
      className="w-32 shrink-0 flex flex-col gap-4"
      style={{
        animation: reduceMotion ? 'none' : `scroll-${direction} ${duration}s linear infinite`,
      }}
    >
      {doubled.map((book, i) => (
        <div
          key={i}
          className="relative w-full aspect-[2/3] rounded-sm overflow-hidden shadow-sm shrink-0"
        >
          <BookCoverPlaceholder
            title={book.title}
            author={book.author}
            volume={book.volume ?? null}
          />
        </div>
      ))}
    </div>
  )
}

function StepContent({ step, firstName }) {
  if (step === 0) {
    return (
      <div className="flex flex-col items-center">
        <img
          src="/favicon.svg"
          alt=""
          className="w-16 h-16 rounded-md shadow-md mb-6"
        />
        <h1 className="font-serif text-xl font-semibold text-center mb-1">
          Bienvenue sur Ex Libris
        </h1>
        {firstName && (
          <p className="font-serif italic font-semibold text-3xl text-stamp text-center mb-3">
            {firstName}
          </p>
        )}
        <p className="text-sm text-ink/70 text-center leading-relaxed">
          Laisse-moi te présenter la nouvelle manière de voir ta bibliothèque.
        </p>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div>
        <h2 className="font-serif text-lg font-semibold text-center mb-2">
          Ajoute un livre
        </h2>
        <p className="text-sm text-ink/70 text-center leading-relaxed mb-5">
          Scanne le code-barres, ou tape l'ISBN à la main. Titre, auteur, éditeur,
          résumé : tout se remplit tout seul, tu n'as plus qu'à relire.
        </p>
        <div className="border border-ink/10 rounded-sm p-4 bg-surface">
          <p className="font-mono text-[9px] uppercase tracking-widest text-ink/50 mb-1.5">
            ISBN
          </p>
          <div className="border border-ink/20 rounded-sm px-2.5 py-2 font-mono text-xs text-ink mb-2 bg-surface">
            978-2-07-036822-8
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-library-fill text-white rounded-sm py-2 text-xs font-medium text-center">
              Chercher
            </div>
            <div className="flex-1 border border-ink/20 text-ink/70 rounded-sm py-2 text-xs font-medium text-center">
              Scanner
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div>
        <h2 className="font-serif text-lg font-semibold text-center mb-2">
          Renseigne autant de détails que tu veux
        </h2>
        <p className="text-sm text-ink/70 text-center leading-relaxed mb-5">
          Traducteur, éditeur, collection, prix, notes, tags : à toi de choisir ce
          qui compte. Range les tomes d'une même série ensemble, ils se
          retrouvent et se parcourent d'affilée.
        </p>
        <div className="border border-ink/10 rounded-sm p-4 bg-surface">
          <div className="flex gap-5 mb-3.5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-ink/50 mb-1">
                Éditeur
              </p>
              <p className="text-xs text-ink">Le Livre de Poche</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-ink/50 mb-1">
                Pages
              </p>
              <p className="font-mono text-xs text-ink">249</p>
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-ink/50 mb-1">
                Prix
              </p>
              <p className="font-mono text-xs text-ink">7.90 €</p>
            </div>
          </div>
          <div className="border-t border-dashed border-ink/15 pt-3">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/50 mb-2">
              Tomes possédés
            </p>
            <div className="flex gap-1.5">
              <span className="w-5 h-5 rounded-full border border-library/40 text-library flex items-center justify-center font-mono text-[9px]">
                1
              </span>
              <span className="w-5 h-5 rounded-full bg-library-fill text-white flex items-center justify-center font-mono text-[9px]">
                2
              </span>
              <span className="w-5 h-5 rounded-full border border-dashed border-ink/25 text-ink/40 flex items-center justify-center font-mono text-[9px]">
                3
              </span>
              <span className="w-5 h-5 rounded-full border border-library/40 text-library flex items-center justify-center font-mono text-[9px]">
                4
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div>
        <h2 className="font-serif text-lg font-semibold text-center mb-2">
          Suis où tu en es
        </h2>
        <p className="text-sm text-ink/70 text-center leading-relaxed mb-5">
          Marque un livre wishlist, à lire, en cours ou lu, et change d'avis
          quand tu veux depuis sa fiche.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {Object.keys(STATUS_LABELS).map((key) => (
            <span
              key={key}
              className={`font-mono text-[10px] uppercase tracking-wide px-3 py-1.5 rounded-full ${STATUS_BADGE_CLASS[key]}`}
            >
              {STATUS_LABELS[key]}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-lg font-semibold text-center mb-2">
        Invite ton foyer
      </h2>
      <p className="text-sm text-ink/70 text-center leading-relaxed mb-5">
        Entre un code d'ami pour voir vos deux bibliothèques côte à côte, et
        fixe-toi un objectif de lecture annuel dans Statistiques.
      </p>
      <div className="flex gap-3">
        <div className="flex-1 border border-ink/10 rounded-sm p-3.5 bg-surface flex flex-col items-center gap-2">
          <div className="flex">
            <div className="w-7 h-7 rounded-full bg-library-fill text-white flex items-center justify-center font-mono text-xs border-2 border-card">
              B
            </div>
            <div className="w-7 h-7 rounded-full bg-brass-fill text-white flex items-center justify-center font-mono text-xs border-2 border-card -ml-2">
              L
            </div>
          </div>
          <p className="text-[11px] text-ink/70 text-center">Partage</p>
        </div>
        <div className="flex-1 border border-ink/10 rounded-sm p-3.5 bg-surface flex flex-col items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-library-fill"
          >
            <path d="M4 20V10" />
            <path d="M12 20V4" />
            <path d="M20 20v-7" />
          </svg>
          <p className="text-[11px] text-ink/70 text-center">Statistiques</p>
        </div>
      </div>
    </div>
  )
}

// Durée de la transition de sortie (ms), à garder cohérente avec la classe
// duration-200 posée plus bas sur le voile et la carte.
const CLOSE_TRANSITION_MS = 200

export default function OnboardingModal({ step, onStepChange, onSkip, onFinish, firstName }) {
  const [closing, setClosing] = useState(false)

  // `step` est piloté par le parent (TutorialContext) : on déduit le sens du
  // glissement en comparant à l'étape précédente. Mise à jour pendant le
  // rendu plutôt que dans un effet (pattern React recommandé pour dériver un
  // état à partir d'un changement de prop), pas de lecture de ref au rendu.
  const [prevStep, setPrevStep] = useState(step)
  const [direction, setDirection] = useState('forward')
  if (step !== prevStep) {
    setPrevStep(step)
    setDirection(step > prevStep ? 'forward' : 'back')
  }

  // Ferme avec une transition de sortie (fondu + léger scale) plutôt qu'une
  // disparition instantanée : on démonte le modal (via `action`, qui vient du
  // parent) seulement une fois le fondu joué, sauf préférence de mouvement
  // réduit où l'on ferme directement.
  const requestClose = useCallback(
    (action) => {
      if (closing) return
      const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduceMotion) {
        action()
        return
      }
      setClosing(true)
      setTimeout(action, CLOSE_TRANSITION_MS)
    },
    [closing],
  )

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') requestClose(onSkip)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSkip, closing, requestClose])

  const isLast = step === TOTAL_STEPS - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutoriel Ex Libris"
      onClick={() => requestClose(onSkip)}
      className={`fixed inset-0 z-50 overflow-hidden bg-ink flex items-center justify-center p-6 transition-opacity duration-200 ${
        closing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="absolute inset-0 flex gap-5 justify-center" aria-hidden="true">
        {COLUMNS.map((col, i) => (
          <CoverColumn key={i} {...col} />
        ))}
      </div>
      <div className="absolute inset-0 bg-ink/86" aria-hidden="true" />

      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[420px] max-h-[85vh] overflow-y-auto bg-card border-t-4 border-dashed border-brass rounded-sm shadow-xl p-8 sm:p-9 transition-all duration-200 ${
          closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <button
          type="button"
          onClick={() => requestClose(onSkip)}
          className="absolute top-4 right-4 text-sm text-ink/50 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm p-1"
        >
          Passer
        </button>

        <div
          className="flex gap-1.5 justify-center mb-6"
          role="tablist"
          aria-label="Étapes du tutoriel"
        >
          {[...Array(TOTAL_STEPS)].map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={step === i}
              onClick={() => onStepChange(i)}
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center font-mono text-[10px] focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
                step === i
                  ? 'bg-library-fill text-white'
                  : 'border border-library/40 text-library hover:bg-library/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div
          key={step}
          className={direction === 'forward' ? 'slide-in-right' : 'slide-in-left'}
        >
          <StepContent step={step} firstName={firstName} />
        </div>

        <div className="flex items-center justify-between gap-3 mt-7">
          <button
            type="button"
            onClick={() => onStepChange(step - 1)}
            disabled={step === 0}
            className="text-sm text-ink/70 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm py-2 disabled:invisible"
          >
            Précédent
          </button>
          <button
            type="button"
            onClick={isLast ? () => requestClose(onFinish) : () => onStepChange(step + 1)}
            className="rounded-sm bg-library-fill text-white font-medium px-5 py-2.5 text-sm hover:bg-library-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
          >
            {isLast ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  )
}
