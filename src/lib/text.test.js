import { describe, expect, it } from 'vitest'
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
