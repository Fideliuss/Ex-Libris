import { useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'

// Un lien "Retour" qui revient à la page précédente (préservant filtres,
// recherche, tri...) au lieu de toujours renvoyer vers une URL fixe qui
// perdrait cet état. Si on arrive directement sur la page (pas d'historique
// dans l'app, ex: lien partagé), on retombe sur `fallback`.
export function useGoBack(fallback = '/') {
  const navigate = useNavigate()
  return () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }
}

// `<Link viewTransition>` only works with React Router's data/framework
// routers — this app uses the plain declarative <BrowserRouter>, where that
// prop is silently ignored. Driving the native View Transitions API
// ourselves works regardless of router mode; flushSync forces the route
// change to apply synchronously so the API captures the right "after" DOM.
//
// `direction` ('forward' | 'back') sets data-transition-direction on <html>,
// which the .volet-in/-out keyframes in index.css read to slide from the
// right (forward, the default) or the left (back).
export function navigateWithViewTransition(navigate, to, direction = 'forward') {
  if (!document.startViewTransition) {
    navigate(to)
    return
  }
  document.documentElement.dataset.transitionDirection = direction
  document.startViewTransition(() => {
    flushSync(() => navigate(to))
  })
}
