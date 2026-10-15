import Modal from './Modal'
import StarRating from './StarRating'
import { backLinkClass } from '../lib/ui'

export default function QuickRatingModal({ bookTitle, onRate, onSkip }) {
  return (
    <Modal
      label="Noter ce livre"
      onClose={onSkip}
      className="w-full max-w-sm bg-card border-t-4 border-dashed border-brass rounded-sm shadow-xl p-7 text-center"
    >
      <p className="font-serif text-lg font-semibold mb-1">Livre terminé !</p>
      <p className="text-sm text-ink/70 mb-5">
        Une note pour <span className="italic">{bookTitle}</span> ?
      </p>
      <div className="flex items-center justify-center mb-6">
        <StarRating value={0} onChange={onRate} size="md" />
      </div>
      <button type="button" onClick={onSkip} className={backLinkClass}>
        Plus tard
      </button>
    </Modal>
  )
}
