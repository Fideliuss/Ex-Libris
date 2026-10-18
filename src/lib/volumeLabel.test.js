import { describe, expect, it } from 'vitest'
import { chipLabel, volumeBadge, volumeLabel } from './volumeLabel'

describe('volumeLabel', () => {
  it('writes "Tome N" for a regular volume, zero included', () => {
    expect(volumeLabel({ series_index: 3 })).toBe('Tome 3')
    expect(volumeLabel({ series_index: 0 })).toBe('Tome 0')
  })

  it('writes nothing for a regular book without a number', () => {
    expect(volumeLabel({ series_index: null })).toBeNull()
    expect(volumeLabel({})).toBeNull()
  })

  it('writes "Hors-série N" for a numbered off-series book', () => {
    expect(volumeLabel({ is_off_series: true, series_index: 2 })).toBe('Hors-série 2')
    expect(volumeLabel({ is_off_series: true, series_index: 0 })).toBe('Hors-série 0')
  })

  it('writes just "Hors-série" for an unnumbered one', () => {
    expect(volumeLabel({ is_off_series: true, series_index: null })).toBe('Hors-série')
    expect(volumeLabel({ is_off_series: true })).toBe('Hors-série')
  })

  it('never says "Tome" for an off-series book', () => {
    expect(volumeLabel({ is_off_series: true, series_index: 4 })).not.toContain('Tome')
  })
})

describe('volumeBadge', () => {
  it('shows the number of a regular volume, zero included', () => {
    expect(volumeBadge({ series_index: 12 })).toBe('12')
    expect(volumeBadge({ series_index: 0 })).toBe('0')
  })

  it('shows nothing for a regular book without a number', () => {
    expect(volumeBadge({ series_index: null })).toBeNull()
    expect(volumeBadge({})).toBeNull()
  })

  it('shows "HS" for an off-series book, numbered or not', () => {
    expect(volumeBadge({ is_off_series: true, series_index: 2 })).toBe('HS')
    expect(volumeBadge({ is_off_series: true, series_index: null })).toBe('HS')
  })
})

describe('chipLabel', () => {
  it('writes the off-series chip as "HS" or "HS N"', () => {
    expect(chipLabel({ type: 'offSeries', index: 2 })).toBe('HS 2')
    expect(chipLabel({ type: 'offSeries', index: 0 })).toBe('HS 0')
    expect(chipLabel({ type: 'offSeries', index: null })).toBe('HS')
  })

  it('writes the number of an owned or missing volume', () => {
    expect(chipLabel({ type: 'owned', index: 5 })).toBe('5')
    expect(chipLabel({ type: 'gap', index: 6 })).toBe('6')
  })
})
