import { useEscapeKey } from '../hooks/useEscapeKey'

// Coque commune des fenêtres modales : voile plein écran, fermeture par clic
// à l'extérieur ou par Échap, contenu qui ne ferme pas au clic. `className`
// décrit le contenu (largeur, carte...), `overlayClass` le voile.
export default function Modal({
  label,
  onClose,
  className = '',
  overlayClass = 'bg-ink/86',
  children,
}) {
  useEscapeKey(onClose)
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 ${overlayClass}`}
    >
      <div onClick={(e) => e.stopPropagation()} className={className}>
        {children}
      </div>
    </div>
  )
}
