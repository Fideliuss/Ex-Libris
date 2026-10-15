import { useAuth } from '../context/AuthContext'
import { useGoBack } from '../lib/navigation'
import { backLinkClass } from '../lib/ui'
import HouseholdSwitchBadge from './HouseholdSwitchBadge'
import LoadingScreen from './LoadingScreen'

// Coque des pages qui montrent la bibliothèque d'un membre du foyer
// (Statistiques, Succès) : lien de retour, titre, sélecteur de foyer, puis
// l'échelle chargement, erreur, vide, contenu. `emptyMessage` vaut null tant
// qu'il y a des livres à montrer.
export default function HouseholdPage({
  title,
  members,
  ownerId,
  onSelectOwner,
  loading,
  error,
  emptyMessage,
  children,
}) {
  const { user } = useAuth()
  const goBack = useGoBack('/')

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-3xl mx-auto">
        <button type="button" onClick={goBack} className={backLinkClass}>
          ← Retour à la collection
        </button>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">{title}</h1>

        {members.length > 1 && (
          <div className="mb-6">
            <HouseholdSwitchBadge
              members={members}
              selectedId={ownerId}
              onSelect={onSelectOwner}
              currentUserId={user.id}
            />
          </div>
        )}

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : error ? (
          <p role="alert" className="text-sm text-stamp text-center py-16">
            Erreur : {error}
          </p>
        ) : emptyMessage ? (
          <p className="text-sm text-ink/70 text-center py-16">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
