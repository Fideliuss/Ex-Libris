import { useEffect } from 'react'

// Couverture en grand, plein écran — partagé entre BookDetail.jsx et
// BookForm.jsx (ajout/édition), plutôt que deux copies de la même modal.
export default function CoverLightbox({ src, alt, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Couverture en grand"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none px-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
      >
        ×
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-full rounded-sm shadow-lg cursor-zoom-out" />
    </div>
  )
}
