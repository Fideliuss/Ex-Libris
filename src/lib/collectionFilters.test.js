import { describe, expect, it } from 'vitest'
import { bookMatchesFilters } from './collectionFilters'

const manga = {
  title: 'One Piece',
  author: ['Eiichiro Oda'],
  type: 'manga',
  publisher: 'Glénat',
  tags: ['aventure'],
}

const novel = {
  title: 'Dune',
  author: ['Frank Herbert'],
  type: 'book',
  publisher: 'Robert Laffont',
  tags: ['sf'],
}

describe('bookMatchesFilters', () => {
  it('matches everything when no filter is active', () => {
    expect(bookMatchesFilters(manga, {})).toBe(true)
    expect(bookMatchesFilters(novel, {})).toBe(true)
  })

  it('filters by a single field', () => {
    expect(bookMatchesFilters(manga, { type: 'manga' })).toBe(true)
    expect(bookMatchesFilters(novel, { type: 'manga' })).toBe(false)
  })

  it('combines several active filters (all must match)', () => {
    const filters = { type: 'manga', publisher: 'Glénat' }
    expect(bookMatchesFilters(manga, filters)).toBe(true)
    expect(bookMatchesFilters({ ...manga, publisher: 'Kana' }, filters)).toBe(false)
  })

  it('ignores the excluded field entirely, even when it would not match', () => {
    // Le livre est un roman (type "book"), pas un manga : sans exclusion,
    // il serait rejeté par le filtre Type. En l'excluant (cas des options
    // du filtre Type lui-même), le reste doit quand même s'appliquer.
    expect(bookMatchesFilters(novel, { type: 'manga' }, 'type')).toBe(true)
  })

  it('still applies every other filter while one is excluded (EXL D.1)', () => {
    // Le scénario concret qui a motivé la demande : Type = Manga doit
    // réduire la liste Auteur aux auteurs ayant au moins un manga, pas la
    // vider ni l'ignorer.
    const filters = { type: 'manga', author: 'quelqu’un d’autre' }
    expect(bookMatchesFilters(manga, filters, 'author')).toBe(true)
    expect(bookMatchesFilters(novel, filters, 'author')).toBe(false)
  })

  it('matches multi-value fields (author, tags) with "includes"/"some"', () => {
    expect(bookMatchesFilters(manga, { author: 'Eiichiro Oda' })).toBe(true)
    expect(bookMatchesFilters(manga, { author: 'Someone Else' })).toBe(false)
    expect(bookMatchesFilters(manga, { selectedTags: ['aventure'] })).toBe(true)
    expect(bookMatchesFilters(manga, { selectedTags: ['sf'] })).toBe(false)
  })

  it('matches single-value fields (publisher, type) with strict equality', () => {
    expect(bookMatchesFilters(manga, { publisher: 'Glénat' })).toBe(true)
    expect(bookMatchesFilters(manga, { publisher: 'glénat' })).toBe(false)
  })

  it('matches the free-text search against title, authors and isbn', () => {
    expect(bookMatchesFilters(manga, { search: 'one piece' })).toBe(true)
    expect(bookMatchesFilters(manga, { search: 'oda' })).toBe(true)
    expect(bookMatchesFilters(manga, { search: 'dune' })).toBe(false)
  })
})
