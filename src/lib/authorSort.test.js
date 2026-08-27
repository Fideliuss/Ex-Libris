import { describe, expect, it } from 'vitest'
import { authorSortKey } from './authorSort'

describe('authorSortKey', () => {
  it('returns the last word of a simple "Prénom Nom" name', () => {
    expect(authorSortKey('Isaac Asimov')).toBe('Asimov')
    expect(authorSortKey('Victor Hugo')).toBe('Hugo')
  })

  it('keeps a hyphenated surname intact', () => {
    expect(authorSortKey('Antoine de Saint-Exupéry')).toBe('Saint-Exupéry')
  })

  it('returns the whole name when there is only one word', () => {
    expect(authorSortKey('Voltaire')).toBe('Voltaire')
  })

  it('only considers the first author when several are listed', () => {
    expect(authorSortKey('Isaac Asimov, Robert Silverberg')).toBe('Asimov')
  })

  it('returns an empty string for missing authors', () => {
    expect(authorSortKey('')).toBe('')
    expect(authorSortKey(null)).toBe('')
    expect(authorSortKey(undefined)).toBe('')
  })
})
