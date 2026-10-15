import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Déconnexion puis retour à l'accueil (remplace l'historique : "Retour" ne
// ramène pas sur une page protégée).
export function useSignOut() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  return async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }
}
