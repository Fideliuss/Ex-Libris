import { describe, expect, it } from 'vitest'
import { STALE_AFTER_MS, needsRefresh, removeFromList, upsertInList } from './libraryCache'

const a = { id: 'a', title: 'A' }
const b = { id: 'b', title: 'B' }

describe('upsertInList', () => {
  it('puts a new book first', () => {
    expect(upsertInList([a], b)).toEqual([b, a])
  })

  it('replaces an existing book in place, keeping the order', () => {
    const updated = { id: 'a', title: 'A2' }
    expect(upsertInList([a, b], updated)).toEqual([updated, b])
  })

  it('does not mutate its input', () => {
    const list = [a]
    upsertInList(list, b)
    expect(list).toEqual([a])
  })
})

describe('removeFromList', () => {
  it('removes the matching book only', () => {
    expect(removeFromList([a, b], 'a')).toEqual([b])
  })

  it('ignores an unknown id', () => {
    expect(removeFromList([a], 'zzz')).toEqual([a])
  })
})

describe('needsRefresh', () => {
  it('is false for a fresh, untouched cache', () => {
    expect(needsRefresh({ invalidated: false, fetchedAt: 1000, now: 1000 + STALE_AFTER_MS })).toBe(false)
  })

  it('is true once the cache is older than the threshold', () => {
    expect(needsRefresh({ invalidated: false, fetchedAt: 1000, now: 1001 + STALE_AFTER_MS })).toBe(true)
  })

  it('is true as soon as it was invalidated, however recent', () => {
    expect(needsRefresh({ invalidated: true, fetchedAt: 1000, now: 1000 })).toBe(true)
  })

  it('is true when nothing was ever fetched', () => {
    expect(needsRefresh({ invalidated: false, fetchedAt: 0, now: Date.now() })).toBe(true)
  })
})
