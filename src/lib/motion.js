// Vrai si l'utilisateur a demandé moins d'animations (réglage système).
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
