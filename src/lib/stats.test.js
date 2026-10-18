import { describe, expect, it } from 'vitest'
import {
  averageRating,
  booksFinishedInPeriod,
  breakdownForYear,
  computePaceStats,
  computePeriodRange,
  computeRatingBars,
  countBy,
  coverWall,
  latestFinishedByType,
  monthlyFinishedBuckets,
  scoreForYear,
  statusTotals,
  tagStatistics,
  typeCounts,
} from './stats'

// Date du jour figée : tous les calculs qui en dépendent sont déterministes.
const NOW = new Date(2026, 5, 15) // 15 juin 2026, heure locale

describe('countBy', () => {
  it('counts books per value, most frequent first, under the requested key', () => {
    const books = [
      { publisher: 'Glénat' },
      { publisher: 'Dargaud' },
      { publisher: 'Glénat' },
      { publisher: 'Glénat' },
      { publisher: 'Dargaud' },
      { publisher: 'Panini' },
    ]
    expect(countBy(books, 'publisher', 'name')).toEqual([
      { name: 'Glénat', count: 3 },
      { name: 'Dargaud', count: 2 },
      { name: 'Panini', count: 1 },
    ])
  })

  it('ignores books without a value', () => {
    const books = [{ series: 'Dune' }, { series: '' }, { series: null }, {}]
    expect(countBy(books, 'series', 'series')).toEqual([{ series: 'Dune', count: 1 }])
  })

  it('returns an empty list for no books', () => {
    expect(countBy([], 'series', 'series')).toEqual([])
  })
})

describe('statusTotals', () => {
  it('counts books per status', () => {
    const books = [
      { status: 'read' },
      { status: 'read' },
      { status: 'reading' },
      { status: 'to-read' },
      { status: 'wishlist' },
    ]
    expect(statusTotals(books)).toMatchObject({
      readCount: 2,
      readingCount: 1,
      toReadCount: 1,
      wishlistCount: 1,
    })
  })

  it('sums prices but leaves out the wishlist, which is not bought yet', () => {
    const books = [
      { status: 'read', price: '12.50' },
      { status: 'to-read', price: 7.5 },
      { status: 'wishlist', price: 100 },
    ]
    expect(statusTotals(books).totalSpent).toBe(20)
  })

  it('treats a missing or invalid price as 0', () => {
    const books = [{ status: 'read' }, { status: 'read', price: null }, { status: 'read', price: 'abc' }]
    expect(statusTotals(books).totalSpent).toBe(0)
  })

  it('is all zero for an empty library', () => {
    expect(statusTotals([])).toEqual({
      readCount: 0,
      readingCount: 0,
      toReadCount: 0,
      wishlistCount: 0,
      totalSpent: 0,
    })
  })
})

describe('scoreForYear', () => {
  it('adds the points of the books finished during the year of "now", by type', () => {
    const books = [
      { type: 'book', date_finished: '2026-01-10' }, // 1
      { type: 'bd', date_finished: '2026-03-02' }, // 0.5
      { type: 'comics', date_finished: '2026-12-31' }, // 0.5
      { type: 'manga', date_finished: '2026-05-05' }, // 1/3
      { date_finished: '2026-02-02' }, // sans type : un livre, 1
    ]
    expect(scoreForYear(books, NOW)).toBeCloseTo(1 + 0.5 + 0.5 + 1 / 3 + 1, 10)
  })

  it('ignores other years and unfinished books', () => {
    const books = [
      { type: 'book', date_finished: '2025-12-31' },
      { type: 'book', date_finished: '2027-01-01' },
      { type: 'book', date_finished: null },
      { type: 'book' },
    ]
    expect(scoreForYear(books, NOW)).toBe(0)
  })

  it('follows the year of "now"', () => {
    const books = [{ type: 'book', date_finished: '2025-06-01' }]
    expect(scoreForYear(books, new Date(2025, 0, 1))).toBe(1)
    expect(scoreForYear(books, new Date(2026, 0, 1))).toBe(0)
  })
})

describe('breakdownForYear', () => {
  it('counts the books finished this year per type, with their points, in type order', () => {
    const books = [
      { type: 'manga', date_finished: '2026-01-01' },
      { type: 'manga', date_finished: '2026-02-01' },
      { type: 'manga', date_finished: '2026-03-01' },
      { type: 'book', date_finished: '2026-04-01' },
      { date_finished: '2026-05-01' },
      { type: 'bd', date_finished: '2025-05-01' },
    ]
    const result = breakdownForYear(books, NOW)
    expect(result.map((r) => r.key)).toEqual(['book', 'manga'])
    expect(result[0]).toEqual({ key: 'book', label: 'Livre', count: 2, points: 2 })
    expect(result[1].count).toBe(3)
    expect(result[1].points).toBeCloseTo(1, 10)
  })

  it('leaves out the types without any book finished this year', () => {
    expect(breakdownForYear([{ type: 'bd', date_finished: '2020-01-01' }], NOW)).toEqual([])
  })
})

describe('latestFinishedByType', () => {
  it('keeps, per type, the book with the most recent finish date', () => {
    const books = [
      { id: 'b1', type: 'book', date_finished: '2024-01-01' },
      { id: 'b2', type: 'book', date_finished: '2025-01-01' },
      { id: 'm1', type: 'manga', date_finished: '2023-01-01' },
    ]
    const result = latestFinishedByType(books)
    expect(result.map((r) => [r.type, r.book.id])).toEqual([
      ['book', 'b2'],
      ['manga', 'm1'],
    ])
    expect(result[0].label).toBe('Livre')
  })

  it('skips unfinished books and types with no finished book', () => {
    const books = [{ id: 'x', type: 'bd', date_finished: null }, { id: 'y', type: 'comics' }]
    expect(latestFinishedByType(books)).toEqual([])
  })

  it('files a book without a type under "book"', () => {
    const result = latestFinishedByType([{ id: 'z', date_finished: '2024-05-05' }])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('book')
  })
})

describe('typeCounts', () => {
  it('counts every type, a book without a type counting as a book', () => {
    const books = [{ type: 'manga' }, { type: 'manga' }, { type: 'bd' }, {}]
    expect(typeCounts(books)).toEqual({ book: 1, bd: 1, comics: 0, manga: 2 })
  })

  it('is all zero for no books', () => {
    expect(typeCounts([])).toEqual({ book: 0, bd: 0, comics: 0, manga: 0 })
  })
})

describe('tagStatistics', () => {
  it('counts books per tag, most used first, with the average of the rated ones', () => {
    const books = [
      { tags: ['sf', 'classique'], rating: 4 },
      { tags: ['sf'], rating: 5 },
      { tags: ['sf'], rating: null },
      { tags: ['aventure'] },
    ]
    const stats = tagStatistics(books)
    expect(stats.map((s) => [s.tag, s.count])).toEqual([
      ['sf', 3],
      ['classique', 1],
      ['aventure', 1],
    ])
    expect(stats[0].avgRating).toBe(4.5)
    expect(stats[1].avgRating).toBe(4)
    expect(stats[2].avgRating).toBeNull()
  })

  it('copes with books that have no tags', () => {
    expect(tagStatistics([{ title: 'A' }, { tags: null }])).toEqual([])
  })
})

describe('computePeriodRange', () => {
  it('"all" has no start and ends now', () => {
    expect(computePeriodRange('all', '', '', NOW)).toEqual({ start: null, end: NOW })
  })

  it('"year" starts on 1 January of the current year', () => {
    expect(computePeriodRange('year', '', '', NOW)).toEqual({
      start: new Date(2026, 0, 1),
      end: NOW,
    })
  })

  it('"rolling12" starts on the first day of the month 11 months earlier', () => {
    expect(computePeriodRange('rolling12', '', '', NOW).start).toEqual(new Date(2025, 6, 1))
  })

  it('"rolling12" crosses the year boundary from January', () => {
    const january = new Date(2026, 0, 10)
    expect(computePeriodRange('rolling12', '', '', january).start).toEqual(new Date(2025, 1, 1))
  })

  it('"custom" uses the chosen dates, read in local time', () => {
    expect(computePeriodRange('custom', '2025-03-15', '2025-09-10', NOW)).toEqual({
      start: new Date(2025, 2, 15),
      end: new Date(2025, 8, 10),
    })
  })

  it('"custom" without a start has no lower bound, without an end it runs to now', () => {
    expect(computePeriodRange('custom', '', '2025-09-10', NOW).start).toBeNull()
    expect(computePeriodRange('custom', '2025-03-15', '', NOW).end).toBe(NOW)
  })
})

describe('booksFinishedInPeriod', () => {
  const books = [
    { id: 'old', date_finished: '2020-01-01' },
    { id: 'edgeStart', date_finished: '2026-01-01' },
    { id: 'mid', date_finished: '2026-03-10' },
    { id: 'edgeEnd', date_finished: '2026-06-15' },
    { id: 'future', date_finished: '2026-06-16' },
    { id: 'none', date_finished: null },
  ]
  const ids = (list) => list.map((b) => b.id)

  it('without a start, keeps everything finished up to the end', () => {
    expect(ids(booksFinishedInPeriod(books, { start: null, end: NOW }))).toEqual([
      'old',
      'edgeStart',
      'mid',
      'edgeEnd',
    ])
  })

  it('includes both boundary days and leaves out unfinished books', () => {
    const range = { start: new Date(2026, 0, 1), end: NOW }
    expect(ids(booksFinishedInPeriod(books, range))).toEqual(['edgeStart', 'mid', 'edgeEnd'])
  })
})

describe('monthlyFinishedBuckets', () => {
  it('makes 12 monthly bars ending on the month of the period end', () => {
    const months = monthlyFinishedBuckets([], { start: null, end: NOW })
    expect(months).toHaveLength(12)
    expect(months[0].key).toBe('2025-6')
    expect(months[0].fullLabel).toBe('juillet 2025')
    expect(months[11].key).toBe('2026-5')
    expect(months[11].fullLabel).toBe('juin 2026')
    expect(months.every((m) => m.count === 0)).toBe(true)
  })

  it('counts each finished book in its month, ignoring books outside the bars', () => {
    const finished = [
      { date_finished: '2026-06-02' },
      { date_finished: '2026-06-14' },
      { date_finished: '2025-07-31' },
      { date_finished: '2020-01-01' }, // plus de 12 mois : hors des barres
    ]
    const months = monthlyFinishedBuckets(finished, { start: null, end: NOW })
    expect(months[11].count).toBe(2)
    expect(months[0].count).toBe(1)
    expect(months.reduce((sum, m) => sum + m.count, 0)).toBe(3)
  })

  it('starts at the month of the period start when it is more recent than 12 months', () => {
    const months = monthlyFinishedBuckets([], { start: new Date(2026, 2, 10), end: NOW })
    expect(months.map((m) => m.key)).toEqual(['2026-2', '2026-3', '2026-4', '2026-5'])
  })

  it('gives a short label for each bar', () => {
    const months = monthlyFinishedBuckets([], { start: null, end: NOW })
    expect(months[0].shortLabel).toBe('juil.')
    expect(months[11].shortLabel).toBe('juin')
  })
})

describe('computePaceStats', () => {
  const range = { start: null, end: NOW }

  it('adds up the pages read, a missing page count counting as 0', () => {
    const finished = [{ date_finished: '2026-05-01', page_count: 200 }, { date_finished: '2026-05-02' }]
    expect(computePaceStats(finished, range).pagesRead).toBe(200)
  })

  it('measures reading durations, with a minimum of one day', () => {
    const finished = [
      { id: 'sameDay', date_started: '2026-05-10', date_finished: '2026-05-10' },
      { id: 'ten', date_started: '2026-04-01', date_finished: '2026-04-11' },
      { id: 'three', date_started: '2026-03-01', date_finished: '2026-03-04' },
    ]
    const pace = computePaceStats(finished, range)
    expect(pace.fastest.book.id).toBe('sameDay')
    expect(pace.fastest.days).toBe(1)
    expect(pace.slowest.book.id).toBe('ten')
    expect(pace.slowest.days).toBe(10)
    expect(pace.avgDays).toBeCloseTo((1 + 10 + 3) / 3, 10)
  })

  it('drops books finished before they were started', () => {
    const finished = [
      { id: 'bad', date_started: '2026-05-10', date_finished: '2026-05-01' },
      { id: 'ok', date_started: '2026-05-01', date_finished: '2026-05-05' },
    ]
    const pace = computePaceStats(finished, range)
    expect(pace.fastest.book.id).toBe('ok')
    expect(pace.avgDays).toBe(4)
  })

  it('has no duration when no book has both dates', () => {
    const pace = computePaceStats([{ date_finished: '2026-05-01' }], range)
    expect(pace.avgDays).toBeNull()
    expect(pace.fastest).toBeNull()
    expect(pace.slowest).toBeNull()
  })

  it('computes books per month from the earliest finish when the period has no start', () => {
    const finished = [
      { date_finished: '2026-04-10' },
      { date_finished: '2026-05-10' },
      { date_finished: '2026-06-10' },
    ]
    // d'avril à juin inclus : 3 mois, 3 livres
    expect(computePaceStats(finished, range).perMonth).toBe(1)
  })

  it('computes books per month from the period start when there is one', () => {
    const finished = [{ date_finished: '2026-06-01' }, { date_finished: '2026-06-02' }]
    const pace = computePaceStats(finished, { start: new Date(2026, 0, 1), end: NOW })
    // de janvier à juin inclus : 6 mois, 2 livres
    expect(pace.perMonth).toBeCloseTo(2 / 6, 10)
  })

  it('is 0 books per month for an empty period', () => {
    expect(computePaceStats([], range).perMonth).toBe(0)
  })
})

describe('computeRatingBars', () => {
  it('makes 11 bars, one per half star from 0 to 5', () => {
    const bars = computeRatingBars([])
    expect(bars).toHaveLength(11)
    expect(bars.every((b) => b.count === 0)).toBe(true)
  })

  it('counts a book in the bar of its rating, an unrated book in the first bar', () => {
    const bars = computeRatingBars([{ rating: 3.5 }, { rating: 3.5 }, { rating: 5 }, { rating: null }, {}])
    expect(bars[7].count).toBe(2)
    expect(bars[10].count).toBe(1)
    expect(bars[0].count).toBe(2)
  })

  it('labels only the whole steps and writes the full label in French', () => {
    const bars = computeRatingBars([])
    expect(bars[0]).toMatchObject({ shortLabel: '—', fullLabel: 'Non noté' })
    expect(bars[1]).toMatchObject({ shortLabel: '', fullLabel: '0.5 étoile' })
    expect(bars[2]).toMatchObject({ shortLabel: '1', fullLabel: '1 étoile' })
    expect(bars[4]).toMatchObject({ shortLabel: '2', fullLabel: '2 étoiles' })
    expect(bars[10]).toMatchObject({ shortLabel: '5', fullLabel: '5 étoiles' })
  })
})

describe('averageRating', () => {
  it('averages the rated books only', () => {
    expect(averageRating([{ rating: 4 }, { rating: 5 }, { rating: 0 }, { rating: null }, {}])).toBe(4.5)
  })

  it('is null when no book is rated', () => {
    expect(averageRating([{ rating: 0 }, {}])).toBeNull()
    expect(averageRating([])).toBeNull()
  })
})

describe('coverWall', () => {
  it('keeps the books with a cover, most recently finished first', () => {
    const finished = [
      { id: 'a', cover_url: 'x', date_finished: '2024-01-01' },
      { id: 'b', cover_url: '', date_finished: '2025-01-01' },
      { id: 'c', cover_url: 'y', date_finished: '2025-06-01' },
    ]
    expect(coverWall(finished).map((b) => b.id)).toEqual(['c', 'a'])
  })

  it('does not reorder the list it is given', () => {
    const finished = [
      { id: 'a', cover_url: 'x', date_finished: '2024-01-01' },
      { id: 'c', cover_url: 'y', date_finished: '2025-06-01' },
    ]
    coverWall(finished)
    expect(finished.map((b) => b.id)).toEqual(['a', 'c'])
  })
})
