import { useState } from 'react'
import { inputClass, labelClass, primaryButtonClass } from '../lib/ui'
import { todayDateOnly } from '../lib/dates'

export default function QuickPurchaseModal({ bookTitle, onConfirm, onSkip }) {
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Achat du livre"
      onClick={onSkip}
      className="fixed inset-0 z-50 bg-ink/86 flex items-center justify-center p-6"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border-t-4 border-dashed border-brass rounded-sm shadow-xl p-7"
      >
        <p className="font-serif text-lg font-semibold mb-1 text-center">
          Tu l'as acheté ?
        </p>
        <p className="text-sm text-ink/70 mb-5 text-center">
          Pour <span className="italic">{bookTitle}</span>, si tu veux garder une trace.
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
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm mt-3"
        >
          Plus tard
        </button>
      </form>
    </div>
  )
}
