import { useState } from 'react'

const STARS = [1, 2, 3, 4, 5]

export default function QuickRatingModal({ bookTitle, onRate, onSkip }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Noter ce livre"
      onClick={onSkip}
      className="fixed inset-0 z-50 bg-ink/86 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card border-t-4 border-dashed border-brass rounded-sm shadow-xl p-7 text-center"
      >
        <p className="font-serif text-lg font-semibold mb-1">Livre terminé !</p>
        <p className="text-sm text-ink/70 mb-5">
          Une note pour <span className="italic">{bookTitle}</span> ?
        </p>
        <div
          className="flex items-center justify-center gap-1 mb-6"
          onMouseLeave={() => setHovered(0)}
        >
          {STARS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onRate(n)}
              onMouseEnter={() => setHovered(n)}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              className="text-3xl leading-none px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              <span
                aria-hidden="true"
                className={hovered >= n ? 'text-brass' : 'text-ink/20'}
              >
                ★
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
