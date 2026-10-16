import { useEffect } from 'react'

// Appelle `onEscape` quand Échap est pressé, tant que le composant est monté.
export function useEscapeKey(onEscape) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEscape])
}
