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

// Un nombre stable par id (0..1), pour dériver rotation/décalage du clou
// sans que ça change de rendu en rendu — deux hashs différents (l'un
// dérivé de l'id seul, l'autre de l'id inversé) pour ne pas corréler les
// deux jitters entre eux.
function hash01(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0
  return (Math.abs(h) % 1000) / 1000
}

function rotationFor(id) {
  const range = 4
  return hash01(id) * (range * 2) - range
}

function pinOffsetFor(id) {
  const range = 5
  return hash01([...id].reverse().join('')) * (range * 2) - range
}

// Regroupe par icône (même symbole = même "famille" de succès) en gardant
// l'ordre d'apparition des icônes, puis aplatit avec un repère de groupe —
// pas d'en-tête ni de fond différent, juste un souffle d'espace un peu plus
// grand entre deux groupes pour que ça reste perceptible sans "sectionner"
// visiblement le mur.
function groupByIcon(items) {
  const order = []
  const groups = new Map()
  for (const item of items) {
    if (!groups.has(item.icon)) {
      groups.set(item.icon, [])
      order.push(item.icon)
    }
    groups.get(item.icon).push(item)
  }
  const flat = []
  order.forEach((icon, i) => {
    if (i > 0) flat.push({ spacer: true, key: `spacer-${icon}` })
    flat.push(...groups.get(icon))
  })
  return flat
}

// Calcule le view-model de chaque succès (paliers "réclamés" compris, lus
// depuis localStorage) et gère la modal déclenchée au clic — promotion pour
// un palier fraîchement atteint, détails pour un succès déjà acquis,
// mystère (sans rien révéler) pour un succès encore hors de portée. Les
// succès à paliers n'affichent qu'UN badge, qui montre le palier le plus
// haut réclamé — atteindre un palier supérieur ne remplace l'affichage
// qu'une fois la promotion confirmée dans la modal.
export default function AchievementsGallery({ books, partner, userId, ownerName }) {
  const [, setVersion] = useState(0)
  const [modal, setModal] = useState(null)

  const rawBadges = useMemo(() => evaluateAchievements(books, { partner }), [books, partner])
  const ownerLine = ownerName ? `Ex-Libris ${ownerName}` : null

  // Pas de useMemo ici : la version doit forcer une relecture du
  // localStorage à chaque clic de promotion, alors qu'elle n'apparaît dans
  // aucune valeur lue par ce calcul (seulement dans son but).
  const items = (() => {
    return rawBadges.map((badge) => {
      if (badge.kind === 'tiered') {
        const displayRank = Number(readState(userId, badge.id, -1))
        const everRevealed = displayRank >= 0
        const promotable = badge.reachedRank > displayRank
        const nextRank = badge.reachedRank
        const nextTierUp = displayRank + 1
        const nextTierHint =
          everRevealed && badge.thresholds[nextTierUp] != null
            ? `Prochain palier : ${badge.tierLabels[nextTierUp]} — ${badge.current}/${badge.thresholds[nextTierUp]}.`
            : null

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
          big: true,
          rotation: rotationFor(badge.id),
          pinOffset: pinOffsetFor(badge.id),
          description: badge.description,
          onClick: () => {
            if (promotable) {
              setModal({
                animate: true,
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
              })
            } else if (everRevealed) {
              setModal({
                headline: 'Détails du succès',
                motto: badge.motto,
                ownerLine,
                bigNumber: badge.thresholds[displayRank],
                subLabel: `${badge.tierLabels[displayRank]} · ${badge.translationBase}`,
                icon: badge.icon,
                tierRank: displayRank,
                dateText: formatUnlockedDate(badge.unlockedAtForRank(displayRank)),
                description: [badge.description, nextTierHint].filter(Boolean).join(' '),
                actionLabel: 'Fermer',
              })
            } else {
              setModal({
                headline: 'Succès verrouillé',
                mystery: true,
                progressText:
                  badge.nextThreshold != null
                    ? `${Math.min(badge.current, badge.nextThreshold)}/${badge.nextThreshold}`
                    : null,
                actionLabel: 'Fermer',
              })
            }
          },
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
        pinOffset: pinOffsetFor(badge.id),
        description: badge.description,
        onClick: () => {
          if (badge.unlocked && !claimed) {
            setModal({
              animate: true,
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
            })
          } else if (claimed) {
            setModal({
              headline: 'Détails du succès',
              motto: badge.motto,
              ownerLine,
              bigNumber: null,
              subLabel: badge.translation,
              icon: badge.icon,
              tierRank: 0,
              dateText: formatUnlockedDate(badge.unlockedAt),
              description: badge.description,
              actionLabel: 'Fermer',
            })
          } else {
            setModal({
              headline: 'Succès verrouillé',
              mystery: true,
              progressText:
                !badge.unlocked && badge.target > 1
                  ? `${badge.current}/${badge.target}`
                  : null,
              actionLabel: 'Fermer',
            })
          }
        },
      }
    })
  })()

  const laidOut = groupByIcon(items)

  function handleCloseModal() {
    modal?.onConfirm?.()
    setModal(null)
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
          {laidOut.map((entry) =>
            entry.spacer ? (
              <div key={entry.key} className="col-span-full h-1" aria-hidden="true" />
            ) : (
              <ExLibrisPlate key={entry.id} vm={entry} />
            ),
          )}
        </div>
      </div>

      {modal && <PromotionModal vm={modal} onClose={handleCloseModal} />}
    </div>
  )
}
