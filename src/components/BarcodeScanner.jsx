import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const VIEWPORT_ID = 'barcode-scanner-viewport'

export default function BarcodeScanner({ onDetected, onClose }) {
  const containerRef = useRef(null)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    const scanner = new Html5Qrcode(VIEWPORT_ID, {
      formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
      verbose: false,
    })
    // html5-qrcode throws (synchronously, not a rejected promise) if stop()
    // is called while the camera isn't actively running — so we track that
    // state ourselves instead of calling stop()/clear() unconditionally.
    let isRunning = false
    let cancelled = false

    async function stopAndClear() {
      if (isRunning) {
        isRunning = false
        try {
          await scanner.stop()
        } catch {
          // déjà arrêtée, rien à faire
        }
      }
      try {
        scanner.clear()
      } catch {
        // rien à nettoyer
      }
    }

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 140 } },
        (decodedText) => {
          if (cancelled) return
          cancelled = true
          stopAndClear().finally(() => onDetected(decodedText))
        },
        undefined,
      )
      .then(() => {
        if (cancelled) {
          // Le composant a été démonté pendant le démarrage de la caméra :
          // elle vient tout juste de démarrer, on l'arrête immédiatement.
          isRunning = true
          stopAndClear()
          return
        }
        isRunning = true
        setStarting(false)
      })
      .catch(() => {
        if (cancelled) return
        setError(
          "Impossible d'accéder à la caméra. Vérifie que tu as autorisé l'accès, ou utilise la saisie manuelle de l'ISBN ci-dessous.",
        )
        setStarting(false)
      })

    return () => {
      cancelled = true
      stopAndClear()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-50 bg-ink/90 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="bg-card rounded-sm shadow-lg max-w-sm w-full p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-serif text-lg">Scanner un code-barres</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le scanner"
            className="text-ink/50 hover:text-stamp text-2xl leading-none px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="py-6 text-center">
            <p role="alert" className="text-sm text-stamp mb-4">
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
            >
              Saisir l'ISBN manuellement
            </button>
          </div>
        ) : (
          <>
            {starting && (
              <p className="font-mono text-xs text-ink/50 text-center mb-2">
                Démarrage de la caméra…
              </p>
            )}
            <div id={VIEWPORT_ID} className="rounded-sm overflow-hidden" />
            <p className="text-xs text-ink/50 text-center mt-2">
              Vise le code-barres EAN-13 au dos du livre.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
