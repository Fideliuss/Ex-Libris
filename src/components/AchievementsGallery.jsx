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

// Regroupe par icône (même symbole = même pilier) en gardant l'ordre
// d'apparition, et sépare la plaque à paliers (le "big" du pilier) des
// succès mineurs — pas d'en-tête ni de fond différent pour distinguer les
// groupes, juste leur composition (2x2 centré + rangée du dessous).
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
  return order.map((icon) => {
    const groupItems = groups.get(icon)
    return {
      key: icon,
      big: groupItems.find((i) => i.big) ?? null,
      minors: groupItems.filter((i) => !i.big),
    }
  })
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
                subLabel: badge.translationBase,
                tierText: badge.tierLabels[nextRank],
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
                subLabel: badge.translationBase,
                tierText: badge.tierLabels[displayRank],
                icon: badge.icon,
                tierRank: displayRank,
                dateText: formatUnlockedDate(badge.unlockedAtForRank(displayRank)),
                description: badge.description,
                nextTierHint,
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
        tierText: null,
        subLabel: badge.translation,
        dateText: claimed ? formatUnlockedDate(badge.unlockedAt) : null,
        progressText:
          !badge.unlocked && badge.target > 1 ? `${badge.current}/${badge.target}` : null,
        icon: badge.icon,
        tierRank: 0,
        seal: true,
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
              seal: true,
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
              seal: true,
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
        className="rounded-lg p-3"
        style={{
          background: 'linear-gradient(160deg, #6b4a2c 0%, #4a3018 55%, #2e1c0d 100%)',
          boxShadow:
            'inset 0 2px 3px rgba(255,220,170,0.18), inset 0 -2px 4px rgba(0,0,0,0.5), 0 6px 14px rgba(0,0,0,0.4)',
        }}
      >
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
          {laidOut.map((group, i) => (
            <div key={group.key}>
              {i > 0 && (
                <div
                  aria-hidden="true"
                  className="h-2.5 rounded-full mb-12"
                  style={{
                    background: 'linear-gradient(180deg, #8a6339 0%, #5c3f22 55%, #3a270f 100%)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,220,170,0.3), inset 0 -1px 1px rgba(0,0,0,0.4), 0 3px 5px rgba(0,0,0,0.45)',
                  }}
                />
              )}
              <CategoryGroup big={group.big} minors={group.minors} />
            </div>
          ))}
        </div>
      </div>

      {modal && <PromotionModal vm={modal} onClose={handleCloseModal} />}
    </div>
  )
}

// Un pilier = sa plaque à paliers centrée sur 2 colonnes (2x2), les 4
// succès mineurs alignés juste en dessous. Sans plaque à paliers
// (Miscellaneous), les mineurs s'alignent simplement en rangée.
function CategoryGroup({ big, minors }) {
  if (!big) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-10 last:mb-0" style={{ gridAutoRows: '78px' }}>
        {minors.map((vm) => (
          <ExLibrisPlate key={vm.id} vm={vm} />
        ))}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-4 gap-4 mb-10 last:mb-0" style={{ gridAutoRows: '78px' }}>
      <div style={{ gridColumn: '2 / span 2', gridRow: '1 / span 2' }}>
        <ExLibrisPlate vm={big} />
      </div>
      {minors.map((vm) => (
        <div key={vm.id} style={{ gridRow: 3 }}>
          <ExLibrisPlate vm={vm} />
        </div>
      ))}
    </div>
  )
}
