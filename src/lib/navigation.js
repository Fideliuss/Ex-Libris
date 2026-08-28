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
//
// `replace` (default false) swaps history.pushState for replaceState, so
// hopping between several sibling pages (ex: tome à tome) doesn't stack up
// one entry per hop — only the page you drilled in from stays behind it.
//
// `preload` (optional) should be the same `() => import('../pages/X')` used
// in App.jsx's `lazy()` for the destination route. Since App.jsx routes are
// lazy-loaded, navigating straight into one mid-transition means React
// renders the Suspense fallback first and swaps in the real page a moment
// later — a DOM mutation outside the transition's captured window, which
// makes the browser abort it with "Transition was aborted because of
// invalid state". Awaiting the same import() first (harmless/instant if
// already loaded, since dynamic imports are cached) guarantees the
// destination is ready before the transition starts, so it's a single
// synchronous swap like the API expects.
export async function navigateWithViewTransition(
  navigate,
  to,
  { direction = 'forward', replace = false, preload } = {},
) {
  if (preload) await preload()

  if (!document.startViewTransition) {
    navigate(to, { replace })
    return
  }
  document.documentElement.dataset.transitionDirection = direction
  const transition = document.startViewTransition(() => {
    flushSync(() => navigate(to, { replace }))
  })
  // Le navigateur peut annuler une transition déjà lancée si le DOM change
  // encore juste après (ex: BookDetail affiche un état "chargement" au
  // montage, puis son propre useEffect de fetch le remplace un instant plus
  // tard) — ça ne casse pas la navigation (déjà faite plus haut), seule
  // l'animation ne joue pas cette fois-là. La transition expose trois
  // promesses indépendantes (updateCallbackDone/ready/finished) et n'importe
  // laquelle peut rejeter selon la raison de l'annulation — sans ces catch,
  // ça remonte comme une erreur non gérée en console à chaque fois.
  transition.updateCallbackDone.catch(() => {})
  transition.ready.catch(() => {})
  transition.finished.catch(() => {})
}
