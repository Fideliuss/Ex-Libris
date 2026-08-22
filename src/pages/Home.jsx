import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import Landing from './Landing'
import Collection from './Collection'

// "/" sert la page vitrine aux visiteurs non connectés, et la collection
// aux utilisateurs déjà authentifiés (pas de redirection vers /login ici).
export default function Home() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />
  return session ? <Collection /> : <Landing />
}
