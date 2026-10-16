import { describe, expect, it } from 'vitest'
import { bookSuggestions } from './bookSuggestions'
import { nullIfEmpty } from './bookPayload'
import { formatDate, parseDateOnly, toDateKey } from './dates'
import { clean, splitList } from './importUtils'
import { validateNewPassword } from './passwordRules'
import { sortedUnique } from './text'

describe('sortedUnique', () => {
  it('dedupes and sorts ignoring accents at the first level', () => {
    expect(sortedUnique(['Étude', 'Ecotopia', 'Étude', 'Zèbre', 'Alpha'])).toEqual([
      'Alpha',
      'Ecotopia',
      'Étude',
      'Zèbre',
    ])
  })
})

describe('bookSuggestions', () => {
  it('collects distinct sorted values per field and skips empties', () => {
    const books = [
      { tags: ['sf', 'aventure'], author: ['B', 'A'], publisher: 'P', collection: '', series: 'S' },
      { tags: ['sf'], author: null, publisher: 'P', translator: ['T'], universe: 'U' },
    ]
    expect(bookSuggestions(books)).toEqual({
      tags: ['aventure', 'sf'],
      authors: ['A', 'B'],
      translators: ['T'],
      illustrators: [],
      collections: [],
      publishers: ['P'],
      series: ['S'],
      universes: ['U'],
    })
  })
})

describe('nullIfEmpty', () => {
  it('returns null for nothing, empty or only blank entries', () => {
    expect(nullIfEmpty(undefined)).toBeNull()
    expect(nullIfEmpty([])).toBeNull()
    expect(nullIfEmpty(['', null])).toBeNull()
  })

  it('keeps the non-empty entries', () => {
    expect(nullIfEmpty(['a', '', 'b'])).toEqual(['a', 'b'])
  })
})

describe('dates', () => {
  it('formats a date-only value as dd/mm/yyyy', () => {
    expect(formatDate('2024-05-03')).toBe('03/05/2024')
    expect(formatDate(null)).toBeNull()
  })

  it('parses a date-only value in local time (no day shift)', () => {
    const d = parseDateOnly('2024-05-03')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2024, 4, 3])
  })

  it('builds a local YYYY-MM-DD key', () => {
    expect(toDateKey(new Date(2024, 0, 9))).toBe('2024-01-09')
  })
})

describe('importUtils', () => {
  it('cleans nullish and padded values', () => {
    expect(clean(null)).toBe('')
    expect(clean('  x ')).toBe('x')
    expect(clean(42)).toBe('42')
  })

  it('splits a comma list, trimming and dropping empties', () => {
    expect(splitList(' a, b , ,c ')).toEqual(['a', 'b', 'c'])
    expect(splitList(undefined)).toEqual([])
  })
})

describe('validateNewPassword', () => {
  it('rejects a short password first, then a mismatch', () => {
    expect(validateNewPassword('abc', 'abc')).toMatch(/au moins 6/)
    expect(validateNewPassword('abcdef', 'abcdeg')).toMatch(/ne correspondent pas/)
  })

  it('accepts a long enough matching password', () => {
    expect(validateNewPassword('abcdef', 'abcdef')).toBeNull()
  })
})
