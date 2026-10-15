import { useState } from 'react'
import Modal from './Modal'
import { inputClass, labelClass, primaryButtonClass, backLinkClass } from '../lib/ui'
import { todayDateOnly } from '../lib/dates'

export default function QuickPurchaseModal({ bookTitle, bookAuthor, onConfirm, onSkip }) {
  const [price, setPrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayDateOnly())

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({
      price: price.trim() ? Number(price) : null,
      purchase_date: purchaseDate || null,
    })
  }

  return (
    <Modal
      label="Achat du livre"
      onClose={onSkip}
      className="w-full max-w-sm bg-card border-t-4 border-dashed border-toread rounded-sm shadow-xl p-7"
    >
      <form onSubmit={handleSubmit}>
        <p className="font-serif text-lg font-semibold mb-1 text-center">
          Ce titre a rejoint ta PAL ?
        </p>
        <p className="text-sm text-ink/70 mb-5 text-center italic">
          {bookTitle}
          {bookAuthor ? ` de ${bookAuthor}` : ''}
        </p>
        <div className="space-y-3 mb-6">
          <div>
            <label htmlFor="quick-purchase-price" className={`${labelClass} block mb-1`}>
              Prix
            </label>
            <input
              id="quick-purchase-price"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00 €"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="quick-purchase-date" className={`${labelClass} block mb-1`}>
              Date d'achat
            </label>
            <input
              id="quick-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <button type="submit" className={`w-full rounded-sm px-4 py-2.5 text-sm ${primaryButtonClass}`}>
          Enregistrer
        </button>
        <button type="button" onClick={onSkip} className={`w-full ${backLinkClass} mt-3`}>
          Plus tard
        </button>
      </form>
    </Modal>
  )
}
