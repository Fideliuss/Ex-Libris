import { describe, expect, it } from 'vitest'
import {
  BINDING_TYPES,
  EDITION_GROUPS,
  EDITION_TYPES,
  FORMAT_TYPES,
  SPECIAL_EDITION_TYPES,
  hasSpecialEdition,
  sortEditions,
} from './editionTypes'

describe('edition types', () => {
  it('lists every type of every group, in group order', () => {
    expect(EDITION_TYPES).toEqual([
      'Poche',
      'Grand format',
      'Numérique',
      'Broché',
      'Relié',
      'Illustrée',
      'Collector',
      'Édition limitée',
      'Édition originale',
      'Intégrale',
    ])
    expect(EDITION_TYPES).toHaveLength(EDITION_GROUPS.flatMap((g) => g.types).length)
  })

  it('exposes the format, binding and special edition lists', () => {
    expect(FORMAT_TYPES).toEqual(['Poche', 'Grand format', 'Numérique'])
    expect(BINDING_TYPES).toEqual(['Broché', 'Relié'])
    expect(SPECIAL_EDITION_TYPES).toContain('Collector')
    expect(SPECIAL_EDITION_TYPES).not.toContain('Poche')
  })

  it('makes format and binding exclusive, and special editions combinable', () => {
    const exclusive = Object.fromEntries(EDITION_GROUPS.map((g) => [g.label, Boolean(g.exclusive)]))
    expect(exclusive).toEqual({ Format: true, Reliure: true, 'Édition spéciale': false })
  })

  it('never uses the same type in two groups', () => {
    expect(new Set(EDITION_TYPES).size).toBe(EDITION_TYPES.length)
  })
})

describe('hasSpecialEdition', () => {
  it('is true when at least one special edition is ticked', () => {
    expect(hasSpecialEdition(['Poche', 'Collector'])).toBe(true)
    expect(hasSpecialEdition(['Intégrale'])).toBe(true)
  })

  it('is false for a plain format or binding', () => {
    expect(hasSpecialEdition(['Poche', 'Broché'])).toBe(false)
  })

  it('is false for no edition at all', () => {
    expect(hasSpecialEdition([])).toBe(false)
    expect(hasSpecialEdition(null)).toBe(false)
    expect(hasSpecialEdition(undefined)).toBe(false)
  })

  it('ignores free-text "Autre" values', () => {
    expect(hasSpecialEdition(['Coffret'])).toBe(false)
  })
})

describe('sortEditions', () => {
  it('puts the values back in group order, whatever the order they were ticked in', () => {
    expect(sortEditions(['Collector', 'Relié', 'Poche'])).toEqual(['Poche', 'Relié', 'Collector'])
  })

  it('puts free-text values last, keeping their relative order', () => {
    expect(sortEditions(['Coffret', 'Collector', 'Dédicacé', 'Poche'])).toEqual([
      'Poche',
      'Collector',
      'Coffret',
      'Dédicacé',
    ])
  })

  it('does not change the list it receives', () => {
    const input = ['Collector', 'Poche']
    sortEditions(input)
    expect(input).toEqual(['Collector', 'Poche'])
  })

  it('returns an empty list for nothing', () => {
    expect(sortEditions([])).toEqual([])
  })
})
