import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import { useProfile } from '../hooks/useProfile'
import { listClaims, upsertClaim } from '../lib/achievementClaims'
import HouseholdPage from '../components/HouseholdPage'
import AchievementsGallery from '../components/AchievementsGallery'

const NO_CLAIMS = new Map()

export default function Achievements() {
  const { user } = useAuth()
  const { members, ownerId, setOwnerId, isMine, books, loading, error } = useHouseholdBooks()
  const { profile } = useProfile()
  const myFirstName = profile?.first_name ?? null
  // Les réclamations sont gardées avec le propriétaire dont elles viennent :
  // en changeant de membre du foyer, celles de l'ancien sont ignorées (état
  // "chargement") jusqu'à l'arrivée des nouvelles.
  const [claimsState, setClaimsState] = useState({ ownerId: null, claims: NO_CLAIMS })
  const claimsLoading = claimsState.ownerId !== ownerId
  const claims = claimsState.ownerId === ownerId ? claimsState.claims : NO_CLAIMS

  useEffect(() => {
    if (!ownerId) return
    let active = true
    listClaims(ownerId)
      .then((rows) => {
        if (active) {
          setClaimsState({ ownerId, claims: new Map(rows.map((r) => [r.badge_id, r.rank])) })
        }
      })
      .catch(() => {
        // Le foyer reste optionnel : une erreur ici ne doit pas bloquer
        // l'affichage des succès eux-mêmes (recalculés depuis les livres).
        if (active) setClaimsState({ ownerId, claims: NO_CLAIMS })
      })
    return () => {
      active = false
    }
  }, [ownerId])

  // Optimiste : l'affichage réagit tout de suite, l'écriture réseau suit
  // en tâche de fond. Jamais appelé si !isMine (voir AchievementsGallery),
  // et de toute façon refusé par la policy RLS insert/update sinon. Écrit
  // sous ownerId (pas user.id) en défense en profondeur : les deux sont
  // censés être égaux ici (onClaim n'est branché que si isMine), mais un
  // bug similaire à celui qu'on vient de corriger dans AchievementsGallery
  // aurait sinon pu de nouveau attribuer la réclamation au mauvais compte.
  const handleClaim = useCallback(
    (badgeId, rank) => {
      setClaimsState((prev) => ({
        ownerId,
        claims: new Map(prev.claims).set(badgeId, rank),
      }))
      upsertClaim(ownerId, badgeId, rank).catch(() => {})
    },
    [ownerId],
  )

  const selectedMember = members.find((m) => m.userId === ownerId)
  const selectedLabel = selectedMember?.displayName ?? selectedMember?.email

  const ownerName = isMine
    ? myFirstName ?? user?.email?.split('@')[0] ?? null
    : selectedLabel ?? null

  return (
    <HouseholdPage
      title="Succès"
      members={members}
      ownerId={ownerId}
      onSelectOwner={setOwnerId}
      loading={loading || claimsLoading}
      error={error}
      emptyMessage={
        books.length === 0
          ? isMine
            ? 'Ajoute des livres à ta collection pour débloquer des succès.'
            : `${selectedLabel} n'a pas encore de livres.`
          : null
      }
    >
      <AchievementsGallery
        books={books}
        partner={members.length > 1}
        ownerName={ownerName}
        isMine={isMine}
        claims={claims}
        onClaim={handleClaim}
      />
    </HouseholdPage>
  )
}
