import StarRating from './StarRating'

export default function QuickRatingModal({ bookTitle, onRate, onSkip }) {
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
        <div className="flex items-center justify-center mb-6">
          <StarRating value={0} onChange={onRate} size="md" />
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
