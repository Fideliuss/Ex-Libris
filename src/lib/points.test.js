import { describe, expect, it } from 'vitest'
import { BOOK_TYPES } from './bookTypes'
import { bookPoints, formatScore, TYPE_POINTS } from './points'

describe('bookPoints', () => {
  it('gives a full point to a book', () => {
    expect(bookPoints({ type: 'book' })).toBe(1)
  })

  it('gives half a point to a BD or comics', () => {
    expect(bookPoints({ type: 'bd' })).toBe(0.5)
    expect(bookPoints({ type: 'comics' })).toBe(0.5)
  })

  it('gives a third of a point to a manga', () => {
    expect(bookPoints({ type: 'manga' })).toBe(1 / 3)
  })

  it('defaults to a book (1 point) when type is missing', () => {
    expect(bookPoints({})).toBe(1)
  })

  it('falls back to 1 point for an unknown type', () => {
    expect(bookPoints({ type: 'audiobook' })).toBe(1)
  })

  it('exposes the same values via TYPE_POINTS', () => {
    expect(TYPE_POINTS.book).toBe(1)
    expect(TYPE_POINTS.manga).toBe(1 / 3)
  })
})

describe('formatScore', () => {
  it('drops useless trailing zeros', () => {
    expect(formatScore(9.5)).toBe('9.5')
    expect(formatScore(12)).toBe('12')
    expect(formatScore(10)).toBe('10')
    expect(formatScore(100)).toBe('100')
    expect(formatScore(0)).toBe('0')
  })

  it('keeps up to two decimals', () => {
    expect(formatScore(1 / 3)).toBe('0.33')
    expect(formatScore(2.5 + 1 / 3)).toBe('2.83')
    expect(formatScore(0.1 + 0.2)).toBe('0.3')
  })
})

describe('book types and points', () => {
  it('gives points to every book type, so a score can never be NaN', () => {
    expect(Object.keys(TYPE_POINTS).sort()).toEqual(Object.keys(BOOK_TYPES).sort())
  })
})
