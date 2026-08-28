import { describe, expect, it } from 'vitest'
import { bookPoints, TYPE_POINTS } from './points'

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
