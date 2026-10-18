import { describe, expect, it } from 'vitest'
import { GAP_COLLAPSE_THRESHOLD, buildTomeSlots } from './tomeSlots'

const owned = (index) => ({ id: `id${index}`, series_index: index, status: 'read' })
const types = (slots) => slots.map((s) => s.type)

describe('buildTomeSlots', () => {
  it('returns nothing without volumes', () => {
    expect(buildTomeSlots([])).toEqual([])
  })

  it('ignores books without a volume number', () => {
    expect(buildTomeSlots([{ id: 'x', series_index: null, status: 'read' }])).toEqual([])
    expect(buildTomeSlots([{ id: 'x', status: 'read' }])).toEqual([])
  })

  it('gives one owned slot for a single volume, keeping its id and status', () => {
    expect(buildTomeSlots([{ id: 'a', series_index: 4, status: 'reading' }])).toEqual([
      { type: 'owned', index: 4, id: 'a', status: 'reading' },
    ])
  })

  it('lists consecutive volumes as owned slots, from the smallest to the largest', () => {
    const slots = buildTomeSlots([owned(3), owned(1), owned(2)])
    expect(slots.map((s) => s.index)).toEqual([1, 2, 3])
    expect(types(slots)).toEqual(['owned', 'owned', 'owned'])
  })

  it('shows one gap slot per missing volume in a small hole', () => {
    const slots = buildTomeSlots([owned(1), owned(3)])
    expect(slots).toEqual([
      { type: 'owned', index: 1, id: 'id1', status: 'read' },
      { type: 'gap', index: 2 },
      { type: 'owned', index: 3, id: 'id3', status: 'read' },
    ])
  })

  it('keeps individual gap slots up to the collapse threshold', () => {
    // 3 tomes manquants d'affilée (2, 3, 4) : seuil atteint mais pas dépassé.
    const slots = buildTomeSlots([owned(1), owned(1 + GAP_COLLAPSE_THRESHOLD + 1)])
    expect(types(slots)).toEqual(['owned', 'gap', 'gap', 'gap', 'owned'])
  })

  it('collapses a hole larger than the threshold into a single ellipsis', () => {
    // 4 tomes manquants d'affilée (2 à 5) : repliés en un seul repère.
    const slots = buildTomeSlots([owned(1), owned(6)])
    expect(slots).toEqual([
      { type: 'owned', index: 1, id: 'id1', status: 'read' },
      { type: 'ellipsis', key: 'ellipsis-2', from: 2, to: 5 },
      { type: 'owned', index: 6, id: 'id6', status: 'read' },
    ])
  })

  it('handles a very long series without producing one slot per missing volume', () => {
    const slots = buildTomeSlots([owned(1), owned(1000)])
    expect(slots).toHaveLength(3)
    expect(slots[1]).toEqual({ type: 'ellipsis', key: 'ellipsis-2', from: 2, to: 999 })
  })

  it('treats each hole on its own', () => {
    const slots = buildTomeSlots([owned(1), owned(3), owned(10), owned(11)])
    expect(types(slots)).toEqual(['owned', 'gap', 'owned', 'ellipsis', 'owned', 'owned'])
    expect(slots[3]).toMatchObject({ from: 4, to: 9 })
  })

  it('starts at the smallest owned volume, not at 1', () => {
    const slots = buildTomeSlots([owned(5), owned(6)])
    expect(slots.map((s) => s.index)).toEqual([5, 6])
  })
})
