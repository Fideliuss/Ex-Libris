import { describe, expect, it } from 'vitest'
import {
  OWN_STALE_AFTER_MS,
  STALE_AFTER_MS,
  removeFromList,
  shouldLoadOwner,
  upsertInList,
} from './libraryCache'

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

describe('shouldLoadOwner', () => {
  const loaded = (fetchedAt) => ({ loaded: true, fetchedAt, books: [] })
  const base = { invalidated: false, now: 1000 }

  it('loads an owner nobody asked for yet', () => {
    expect(shouldLoadOwner({ ...base, entry: undefined, isMine: true })).toBe(true)
    expect(shouldLoadOwner({ ...base, entry: undefined, isMine: false })).toBe(true)
  })

  it('retries an owner whose last load failed', () => {
    expect(shouldLoadOwner({ ...base, entry: { loaded: false, error: 'x' }, isMine: true })).toBe(true)
  })

  it('keeps another member fresh until the short threshold is passed', () => {
    const entry = loaded(1000)
    expect(shouldLoadOwner({ ...base, entry, isMine: false, now: 1000 + STALE_AFTER_MS })).toBe(false)
    expect(shouldLoadOwner({ ...base, entry, isMine: false, now: 1001 + STALE_AFTER_MS })).toBe(true)
  })

  it('keeps my own books fresh far longer than another member', () => {
    const entry = loaded(1000)
    const now = 1001 + STALE_AFTER_MS
    expect(shouldLoadOwner({ ...base, entry, isMine: true, now })).toBe(false)
    expect(shouldLoadOwner({ ...base, entry, isMine: true, now: 1001 + OWN_STALE_AFTER_MS })).toBe(true)
  })

  it('reloads as soon as it was invalidated, however recent', () => {
    expect(shouldLoadOwner({ ...base, entry: loaded(1000), isMine: true, invalidated: true })).toBe(true)
  })
})
