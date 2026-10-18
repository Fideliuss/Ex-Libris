// Au-delà de ce nombre de tomes manquants d'affilée, on compresse le trou en
// une seule chip "···" plutôt que d'en afficher une par tome manquant :
// sans ça, posséder les tomes 1 et 1000 d'une longue série générerait ~1000
// chips grisées.
export const GAP_COLLAPSE_THRESHOLD = 3

// Les hors-séries (livres de la série hors de sa numérotation) ne comptent
// pas dans les trous : ils forment des chips à part, après les tomes, par
// numéro, ceux sans numéro en dernier. Un hors-série peut porter le même
// numéro qu'un tome régulier.
function offSeriesSlots(siblings) {
  return siblings
    .filter((s) => s.is_off_series)
    .sort((a, b) => {
      if (a.series_index == null || b.series_index == null) {
        return (a.series_index == null) - (b.series_index == null)
      }
      return a.series_index - b.series_index
    })
    .map((s) => ({
      type: 'offSeries',
      index: s.series_index ?? null,
      id: s.id,
      status: s.status,
      key: `off-${s.id}`,
    }))
}

// Construit la rangée de chips [tome possédé | tome manquant | trou
// compressé] entre le plus petit et le plus grand tome possédé (pas besoin
// de connaître la taille réelle de la série, juste l'étendue de ce qu'on a),
// suivie des hors-séries.
export function buildTomeSlots(siblings) {
  const offSeries = offSeriesSlots(siblings)
  const numbered = siblings.filter((s) => !s.is_off_series && s.series_index != null)
  if (numbered.length === 0) return offSeries
  const ownedByIndex = new Map(
    numbered.map((s) => [s.series_index, { id: s.id, status: s.status }]),
  )
  const indices = numbered.map((s) => s.series_index)
  const min = Math.min(...indices)
  const max = Math.max(...indices)

  const slots = []
  let i = min
  while (i <= max) {
    if (ownedByIndex.has(i)) {
      const { id, status } = ownedByIndex.get(i)
      slots.push({ type: 'owned', index: i, id, status })
      i += 1
      continue
    }
    let gapEnd = i
    while (gapEnd <= max && !ownedByIndex.has(gapEnd)) gapEnd += 1
    const gapLength = gapEnd - i
    if (gapLength > GAP_COLLAPSE_THRESHOLD) {
      slots.push({ type: 'ellipsis', key: `ellipsis-${i}`, from: i, to: gapEnd - 1 })
    } else {
      for (let j = i; j < gapEnd; j += 1) {
        slots.push({ type: 'gap', index: j })
      }
    }
    i = gapEnd
  }
  return [...slots, ...offSeries]
}
