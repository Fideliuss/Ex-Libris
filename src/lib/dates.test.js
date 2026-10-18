import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatDate, parseDateOnly, toDateKey, todayDateOnly } from './dates'

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

  it('pads the month and the day, and keeps two digits for December and the 31st', () => {
    expect(toDateKey(new Date(2024, 11, 31))).toBe('2024-12-31')
    expect(toDateKey(new Date(2024, 8, 5))).toBe('2024-09-05')
  })

  it('returns null for an empty date', () => {
    expect(formatDate('')).toBeNull()
    expect(formatDate(undefined)).toBeNull()
  })

  it('round-trips a date-only value through parseDateOnly and toDateKey', () => {
    expect(toDateKey(parseDateOnly('2024-02-29'))).toBe('2024-02-29')
    expect(toDateKey(parseDateOnly('2023-12-31'))).toBe('2023-12-31')
  })
})

describe('todayDateOnly', () => {
  const originalTimeZone = process.env.TZ

  afterEach(() => {
    vi.useRealTimers()
    if (originalTimeZone === undefined) delete process.env.TZ
    else process.env.TZ = originalTimeZone
  })

  // Le fuseau est fixé dans chaque test : le résultat ne dépend pas de la
  // machine qui lance les tests (la CI est en UTC, un poste peut être en
  // France), et une version qui passerait par toISOString() (UTC) serait
  // détectée quelle que soit cette machine.
  it('gives the local date of today', () => {
    process.env.TZ = 'Europe/Paris'
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0))
    expect(todayDateOnly()).toBe('2026-06-15')
  })

  it('stays on the local day late in the evening west of UTC, with no UTC shift', () => {
    process.env.TZ = 'America/Los_Angeles'
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15, 23, 59)) // déjà le 16 en UTC
    expect(todayDateOnly()).toBe('2026-06-15')
  })

  it('stays on the local day just after midnight east of UTC, with no UTC shift', () => {
    process.env.TZ = 'Pacific/Auckland'
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 16, 0, 1)) // encore le 15 en UTC
    expect(todayDateOnly()).toBe('2026-06-16')
  })
})
