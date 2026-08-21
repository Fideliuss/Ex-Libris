import { useNavigate } from 'react-router-dom'

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
