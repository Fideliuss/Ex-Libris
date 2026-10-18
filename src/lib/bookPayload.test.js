import { describe, expect, it } from 'vitest'
import { nullIfEmpty, parseSeriesIndex, pickEditable, seriesFields } from './bookPayload'

describe('pickEditable', () => {
  it('drops database-managed columns and unknown keys', () => {
    const book = {
      id: 'x',
      user_id: 'u',
      created_at: 't',
      updated_at: 't',
      extra: 1,
      title: 'Dune',
      tags: ['sf'],
    }
    expect(pickEditable(book)).toEqual({ title: 'Dune', tags: ['sf'] })
  })

  it('keeps falsy values such as null and 0', () => {
    expect(pickEditable({ rating: 0, series: null })).toEqual({ rating: 0, series: null })
  })

  it('lets the off-series flag through, false included', () => {
    expect(pickEditable({ is_off_series: true })).toEqual({ is_off_series: true })
    expect(pickEditable({ is_off_series: false })).toEqual({ is_off_series: false })
  })
})

describe('parseSeriesIndex', () => {
  it('reads an empty field as no number', () => {
    expect(parseSeriesIndex('')).toBeNull()
    expect(parseSeriesIndex(null)).toBeNull()
    expect(parseSeriesIndex(undefined)).toBeNull()
  })

  it('reads whole numbers, zero included, from text or numbers', () => {
    expect(parseSeriesIndex('3')).toBe(3)
    expect(parseSeriesIndex('0')).toBe(0)
    expect(parseSeriesIndex(0)).toBe(0)
    expect(parseSeriesIndex(' 12 ')).toBe(12)
    expect(parseSeriesIndex(336)).toBe(336)
  })

  it('refuses a decimal number with a clear message', () => {
    expect(() => parseSeriesIndex('2.5')).toThrow('entier')
    expect(() => parseSeriesIndex(0.5)).toThrow('entier')
  })

  it('refuses text that is not a number', () => {
    expect(() => parseSeriesIndex('abc')).toThrow('entier')
  })
})

describe('seriesFields', () => {
  it('cleans the series name and reads the volume number', () => {
    expect(seriesFields({ series: '  Dune ', series_index: '3', is_off_series: false })).toEqual({
      series: 'Dune',
      series_index: 3,
      is_off_series: false,
    })
  })

  it('keeps an off-series book in its series, with or without a number', () => {
    expect(seriesFields({ series: 'Dune', series_index: '2', is_off_series: true })).toEqual({
      series: 'Dune',
      series_index: 2,
      is_off_series: true,
    })
    expect(seriesFields({ series: 'Dune', series_index: '', is_off_series: true })).toEqual({
      series: 'Dune',
      series_index: null,
      is_off_series: true,
    })
  })

  it('turns the off-series flag off when there is no series', () => {
    expect(seriesFields({ series: '   ', series_index: '', is_off_series: true })).toEqual({
      series: null,
      series_index: null,
      is_off_series: false,
    })
    expect(seriesFields({ series: null, series_index: null, is_off_series: true }).is_off_series).toBe(false)
  })

  it('treats a missing flag as a regular volume', () => {
    expect(seriesFields({ series: 'Dune', series_index: '1' }).is_off_series).toBe(false)
  })

  it('keeps a volume number even when the series is empty, as before', () => {
    expect(seriesFields({ series: '', series_index: '5', is_off_series: false })).toEqual({
      series: null,
      series_index: 5,
      is_off_series: false,
    })
  })

  it('refuses a decimal volume number', () => {
    expect(() => seriesFields({ series: 'Dune', series_index: '1.5', is_off_series: false })).toThrow('entier')
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
