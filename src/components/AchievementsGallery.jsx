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

// Légère rotation propre à chaque plaque (mur à trophées) : dérivée de
// l'id du succès plutôt que tirée au hasard à chaque rendu, pour qu'elle
// reste stable d'un rafraîchissement à l'autre.
function rotationFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0
  const range = 2.5
  return ((Math.abs(hash) % 1000) / 1000) * (range * 2) - range
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
          big: everRevealed && displayRank === 3,
          rotation: rotationFor(badge.id),
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
        big: false,
        rotation: rotationFor(badge.id),
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
      <div
        className="rounded-md p-5"
        style={{
          background:
            'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.05) 0 1.5px, transparent 2px) 0 0/16px 16px, ' +
            'radial-gradient(circle at 60% 70%, rgba(255,255,255,0.04) 0 1.5px, transparent 2px) 4px 8px/20px 20px, ' +
            'linear-gradient(160deg, #3f2c1e 0%, #2a1c12 100%)',
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          style={{ gridAutoRows: '78px' }}
        >
          {items.map((vm) => (
            <ExLibrisPlate key={vm.id} vm={vm} />
          ))}
        </div>
      </div>

      {promotion && <PromotionModal vm={promotion} onClose={handleClosePromotion} />}
    </div>
  )
}
