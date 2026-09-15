import { describe, expect, it } from 'vitest'
import { getMissingFields, isBookIncomplete } from './bookCompleteness'

const COMPLETE_BOOK = {
  isbn: '9782070368228',
  cover_url: 'https://example.com/cover.jpg',
  author: ['Albert Camus'],
  publisher: 'Gallimard',
  page_count: 159,
  description: 'Un résumé.',
}

describe('getMissingFields', () => {
  it('returns nothing for a fully filled-in book', () => {
    expect(getMissingFields(COMPLETE_BOOK)).toEqual([])
  })

  it('flags a missing ISBN', () => {
    expect(getMissingFields({ ...COMPLETE_BOOK, isbn: null })).toContain('ISBN')
  })

  it('flags every field missing on a bare book', () => {
    expect(getMissingFields({})).toEqual([
      'ISBN',
      'Couverture',
      'Auteur',
      'Éditeur',
      'Pages',
      'Résumé',
    ])
  })

  it('treats an empty author array as missing', () => {
    expect(getMissingFields({ ...COMPLETE_BOOK, author: [] })).toContain('Auteur')
  })
})

describe('isBookIncomplete', () => {
  it('is false for a fully filled-in book', () => {
    expect(isBookIncomplete(COMPLETE_BOOK)).toBe(false)
  })

  it('is true as soon as one field is missing', () => {
    expect(isBookIncomplete({ ...COMPLETE_BOOK, isbn: null })).toBe(true)
  })
})
