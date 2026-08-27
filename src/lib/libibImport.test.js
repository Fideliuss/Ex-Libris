import { describe, expect, it } from 'vitest'
import { computeSeriesRepair, mapLibibRowToBook, parseLibibCsv } from './libibImport'

describe('parseLibibCsv', () => {
  it('parses a header + data row into an object', () => {
    const csv = 'title,creators\nFondation,Isaac Asimov\n'
    expect(parseLibibCsv(csv)).toEqual([
      { title: 'Fondation', creators: 'Isaac Asimov' },
    ])
  })
})

describe('mapLibibRowToBook', () => {
  it('maps the core fields, preferring the ISBN-13 over the UPC/ISBN-10', () => {
    const book = mapLibibRowToBook({
      title: 'Fondation',
      creators: 'Isaac Asimov',
      publisher: 'Folio SF',
      ean_isbn13: '9782070360536',
      upc_isbn10: '2070360531',
    })
    expect(book.title).toBe('Fondation')
    expect(book.author).toBe('Isaac Asimov')
    expect(book.publisher).toBe('Folio SF')
    expect(book.isbn).toBe('9782070360536')
  })

  it('falls back to the ISBN-10 when the ISBN-13 is missing', () => {
    const book = mapLibibRowToBook({ title: 'X', ean_isbn13: '', upc_isbn10: '2070360531' })
    expect(book.isbn).toBe('2070360531')
  })

  it('extracts a leading tome number from the title when the row has a series', () => {
    const book = mapLibibRowToBook({
      title: '2 - Fairy Dance',
      group: 'Sword Art Online',
    })
    expect(book.title).toBe('Fairy Dance')
    expect(book.series).toBe('Sword Art Online')
    expect(book.series_index).toBe(2)
  })

  it('leaves the title untouched when there is no series', () => {
    const book = mapLibibRowToBook({ title: '2 - Fairy Dance', group: '' })
    expect(book.title).toBe('2 - Fairy Dance')
    expect(book.series).toBeNull()
    expect(book.series_index).toBeNull()
  })

  it('maps Libib statuses to the app statuses, defaulting unknown ones to to-read', () => {
    expect(mapLibibRowToBook({ title: 'X', status: 'Not Begun' }).status).toBe('to-read')
    expect(mapLibibRowToBook({ title: 'X', status: 'In Progress' }).status).toBe('reading')
    expect(mapLibibRowToBook({ title: 'X', status: 'Completed' }).status).toBe('read')
    expect(mapLibibRowToBook({ title: 'X', status: '' }).status).toBe('to-read')
  })

  it('splits and trims the comma-separated tags field', () => {
    const book = mapLibibRowToBook({ title: 'X', tags: 'sf, classique ,  ' })
    expect(book.tags).toEqual(['sf', 'classique'])
  })

  it('converts numeric fields, leaving them null when blank', () => {
    const withValues = mapLibibRowToBook({
      title: 'X',
      rating: '4.6',
      length: '320',
      price: '12.5',
    })
    expect(withValues.rating).toBe(5) // rounded
    expect(withValues.page_count).toBe(320)
    expect(withValues.price).toBe(12.5)

    const blank = mapLibibRowToBook({ title: 'X' })
    expect(blank.rating).toBeNull()
    expect(blank.page_count).toBeNull()
    expect(blank.price).toBeNull()
  })
})

describe('computeSeriesRepair', () => {
  it('returns null when the row has no series to repair with', () => {
    expect(computeSeriesRepair({ series: null }, { group: '' })).toBeNull()
  })

  it('returns null when the existing book already matches, nothing to fix', () => {
    const existing = { series: 'Sword Art Online', series_index: 2, title: 'Fairy Dance', tags: [] }
    const patch = computeSeriesRepair(existing, { group: 'Sword Art Online', title: '2 - Fairy Dance' })
    expect(patch).toBeNull()
  })

  it('fills in a missing series/tome on an already-imported book', () => {
    const existing = { series: null, series_index: null, title: '2 - Fairy Dance', tags: [] }
    const patch = computeSeriesRepair(existing, { group: 'Sword Art Online', title: '2 - Fairy Dance' })
    expect(patch).toEqual({
      series: 'Sword Art Online',
      series_index: 2,
      title: 'Fairy Dance',
    })
  })

  it('removes a tag that duplicates the series name once the series field is set', () => {
    const existing = {
      series: 'Sword Art Online',
      series_index: 2,
      title: 'Fairy Dance',
      tags: ['Sword Art Online', 'fantasy'],
    }
    const patch = computeSeriesRepair(existing, { group: 'Sword Art Online', title: 'Fairy Dance' })
    expect(patch).toEqual({ tags: ['fantasy'] })
  })
})
