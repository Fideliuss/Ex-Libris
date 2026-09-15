import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import { getMyProfile } from '../lib/friendCode'
import { useGoBack } from '../lib/navigation'
import HouseholdTabs from '../components/HouseholdTabs'
import AchievementsGallery from '../components/AchievementsGallery'
import LoadingScreen from '../components/LoadingScreen'

export default function Achievements() {
  const { user } = useAuth()
  const { members, ownerId, setOwnerId, isMine, books, loading, error } = useHouseholdBooks()
  const goBack = useGoBack('/')
  const [myFirstName, setMyFirstName] = useState(null)

  // Pour la ligne "Ex-Libris {prénom}" gravée sur les plaques de succès :
  // le prénom du membre du foyer affiché est déjà sur selectedMember, mais
  // le sien propre n'est nulle part ailleurs dans l'app à ce niveau.
  useEffect(() => {
    if (!user) return
    let active = true
    getMyProfile(user.id)
      .then((profile) => {
        if (active) setMyFirstName(profile?.first_name ?? null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [user])

  const selectedMember = members.find((m) => m.userId === ownerId)
  const selectedLabel = selectedMember?.displayName ?? selectedMember?.email

  const ownerName = isMine
    ? myFirstName ?? user?.email?.split('@')[0] ?? null
    : selectedLabel ?? null

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </button>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">Succès</h1>

        {members.length > 1 && (
          <HouseholdTabs
            members={members}
            selectedId={ownerId}
            onSelect={setOwnerId}
            labelFor={(m) =>
              m.userId === user.id ? 'Mes succès' : `Succès de ${m.displayName ?? m.email}`
            }
            ariaLabel="Succès à afficher"
          />
        )}

        {loading ? (
          <LoadingScreen fullScreen={false} />
        ) : error ? (
          <p role="alert" className="text-sm text-stamp text-center py-16">
            Erreur : {error}
          </p>
        ) : books.length === 0 ? (
          <p className="text-sm text-ink/70 text-center py-16">
            {isMine
              ? 'Ajoute des livres à ta collection pour débloquer des succès.'
              : `${selectedLabel} n'a pas encore de livres.`}
          </p>
        ) : (
          <AchievementsGallery
            books={books}
            partner={members.length > 1}
            userId={user?.id}
            ownerName={ownerName}
          />
        )}
      </div>
    </div>
  )
}
