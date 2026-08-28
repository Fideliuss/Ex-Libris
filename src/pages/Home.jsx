import { useAuth } from '../context/AuthContext'
import LoadingScreen from '../components/LoadingScreen'
import Landing from './Landing'
import Collection from './Collection'

// "/" sert la page vitrine aux visiteurs non connectés, et la collection
// aux utilisateurs déjà authentifiés (pas de redirection vers /login ici).
//
// Landing et Collection restent importées directement (pas de lazy() ici) :
// Home elle-même est déjà découpée au niveau du routeur (App.jsx), donc les
// re-séparer ajouterait un deuxième niveau de Suspense imbriqué — ce qui
// casse les transitions animées (navigateWithViewTransition ne peut
// précharger qu'un seul chunk, pas deux niveaux). Le gain de taille
// supplémentaire ne vaut pas la complexité.
export default function Home() {
  const { session, loading } = useAuth()

  if (loading) return <LoadingScreen />
  return session ? <Collection /> : <Landing />
}
