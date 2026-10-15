import { describe, expect, it } from 'vitest'
import { bookMatchesFilters, computeFacets } from './collectionFilters'
import { sortedUnique } from './text'

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

describe('computeFacets', () => {
  const books = [
    { title: 'A', author: ['X', 'Y'], type: 'manga', publisher: 'P1', collection: 'C1', series: 'S1', universe: 'U1', edition: ['Poche'], tags: ['t1', 't2'], status: 'read' },
    { title: 'B', author: ['Z'], type: 'book', publisher: 'P2', collection: null, series: null, universe: null, edition: [], tags: ['t2'], status: 'to-read' },
    { title: 'C', author: ['X'], type: 'manga', publisher: 'P2', collection: 'C2', series: 'S1', universe: 'U1', edition: ['Collector'], tags: [], status: 'read' },
    { title: 'D', author: [], type: 'comics', publisher: '', collection: 'C1', series: 'S2', universe: null, edition: null, tags: null, status: 'wishlist' },
  ]

  // Référence : l'ancienne implémentation, un filtrage complet par champ.
  function reference(filters) {
    const pool = (key) => books.filter((b) => bookMatchesFilters(b, filters, key))
    const collect = (key, pick) => sortedUnique(pool(key).flatMap(pick))
    const statusCounts = {}
    for (const b of pool('status')) statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1
    return {
      tags: collect('tags', (b) => b.tags ?? []),
      publisher: collect('publisher', (b) => (b.publisher ? [b.publisher] : [])),
      author: collect('author', (b) => b.author ?? []),
      collection: collect('collection', (b) => (b.collection ? [b.collection] : [])),
      edition: collect('edition', (b) => b.edition ?? []),
      series: collect('series', (b) => (b.series ? [b.series] : [])),
      universe: collect('universe', (b) => (b.universe ? [b.universe] : [])),
      statusCounts,
    }
  }

  const scenarios = [
    {},
    { type: 'manga' },
    { publisher: 'P2' },
    { type: 'manga', publisher: 'P2' },
    { author: 'X', status: 'read' },
    { selectedTags: ['t2'] },
    { selectedTags: ['t1'], series: 'S1', universe: 'U1' },
    { search: 'b' },
    { search: 'zzz' },
    { status: 'wishlist', type: 'comics', collection: 'C1' },
  ]

  it.each(scenarios)('est identique à un filtrage par champ (%j)', (filters) => {
    expect(computeFacets(books, filters)).toEqual(reference(filters))
  })
})
