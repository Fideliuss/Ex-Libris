import { describe, expect, it } from 'vitest'
import { formatDate, parseDateOnly, toDateKey } from './dates'

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
