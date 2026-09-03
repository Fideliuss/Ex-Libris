import { useMemo, useState } from 'react'
import { evaluateAchievements } from '../lib/achievements'
import { formatUnlockedDate } from '../lib/achievementVisuals'
import ExLibrisPlate from './ExLibrisPlate'
import PromotionModal from './PromotionModal'

function storageKey(userId, id) {
  return `exlibris:${userId ?? 'anon'}:${id}`
}

function readState(userId, id, fallback) {
  try {
    const value = localStorage.getItem(storageKey(userId, id))
    return value == null ? fallback : value
  } catch {
    return fallback
  }
}

function writeState(userId, id, value) {
  try {
    localStorage.setItem(storageKey(userId, id), value)
  } catch {
    // localStorage indisponible (navigation privée...) : l'état reste en
    // mémoire pour cette session, tant pis pour la persistance.
  }
}

// Calcule le view-model de chaque succès (paliers "réclamés" compris, lus
// depuis localStorage) et gère la modal de révélation/promotion déclenchée
// au clic. Les succès à paliers n'affichent qu'UN badge, qui montre le
// palier le plus haut réclamé — atteindre un palier supérieur ne remplace
// l'affichage qu'une fois la promotion confirmée dans la modal.
export default function AchievementsGallery({ books, partner, userId, ownerName }) {
  const [, setVersion] = useState(0)
  const [promotion, setPromotion] = useState(null)

  const rawBadges = useMemo(() => evaluateAchievements(books, { partner }), [books, partner])
  const ownerLine = ownerName ? `Ex-Libris ${ownerName}` : null

  // Pas de useMemo ici : `version` doit forcer une relecture du
  // localStorage à chaque clic de promotion, alors qu'il n'apparaît dans
  // aucune valeur lue par ce calcul (seulement dans son but).
  const items = (() => {
    return rawBadges.map((badge) => {
      if (badge.kind === 'tiered') {
        const displayRank = Number(readState(userId, badge.id, -1))
        const everRevealed = displayRank >= 0
        const promotable = badge.reachedRank > displayRank
        const nextRank = badge.reachedRank

        return {
          id: badge.id,
          motto: badge.motto,
          ownerLine,
          bigNumber: everRevealed ? badge.thresholds[displayRank] : null,
          tierText: everRevealed ? badge.tierLabels[displayRank] : null,
          subLabel: badge.translationBase,
          dateText: everRevealed
            ? formatUnlockedDate(badge.unlockedAtForRank(displayRank))
            : null,
          progressText:
            !everRevealed && badge.nextThreshold != null
              ? `${Math.min(badge.current, badge.nextThreshold)}/${badge.nextThreshold}`
              : null,
          icon: badge.icon,
          tierRank: Math.max(displayRank, 0),
          locked: !everRevealed,
          promotable,
          everRevealed,
          description: badge.description,
          onClick: () =>
            setPromotion({
              onConfirm: () => {
                writeState(userId, badge.id, String(nextRank))
                setVersion((v) => v + 1)
              },
              motto: badge.motto,
              ownerLine,
              headline: everRevealed ? 'Promotion !' : 'Nouveau succès',
              bigNumber: badge.thresholds[nextRank],
              subLabel: `${badge.tierLabels[nextRank]} · ${badge.translationBase}`,
              icon: badge.icon,
              tierRank: nextRank,
              dateText: formatUnlockedDate(badge.unlockedAtForRank(nextRank)),
            }),
        }
      }

      const claimed = readState(userId, badge.id, '0') === '1'
      return {
        id: badge.id,
        motto: badge.motto,
        ownerLine,
        bigNumber: null,
        tierText: claimed ? 'Bronze' : null,
        subLabel: badge.translation,
        dateText: claimed ? formatUnlockedDate(badge.unlockedAt) : null,
        progressText:
          !badge.unlocked && badge.target > 1 ? `${badge.current}/${badge.target}` : null,
        icon: badge.icon,
        tierRank: 0,
        locked: !badge.unlocked,
        promotable: badge.unlocked && !claimed,
        everRevealed: claimed,
        description: badge.description,
        onClick: () =>
          setPromotion({
            onConfirm: () => {
              writeState(userId, badge.id, '1')
              setVersion((v) => v + 1)
            },
            motto: badge.motto,
            ownerLine,
            headline: 'Nouveau succès',
            bigNumber: null,
            subLabel: badge.translation,
            icon: badge.icon,
            tierRank: 0,
            dateText: formatUnlockedDate(badge.unlockedAt),
          }),
      }
    })
  })()

  function handleClosePromotion() {
    promotion?.onConfirm()
    setPromotion(null)
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((vm) => (
          <ExLibrisPlate key={vm.id} vm={vm} />
        ))}
      </div>

      {promotion && <PromotionModal vm={promotion} onClose={handleClosePromotion} />}
    </div>
  )
}
