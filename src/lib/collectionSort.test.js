import { describe, expect, it } from 'vitest'
import {
  SORT_OPTIONS,
  finishedTime,
  groupKeyFor,
  letterGroupKey,
  monthLabel,
  titleCompare,
} from './collectionSort'

// Ordre obtenu en triant une copie de la liste avec le comparateur donné.
const order = (books, compare) => [...books].sort(compare).map((b) => b.id)

describe('titleCompare', () => {
  it('sorts alphabetically, ignoring accents at the first level', () => {
    const books = [
      { id: 'etude', title: 'Étude' },
      { id: 'eco', title: 'Ecotopia' },
      { id: 'zebre', title: 'Zèbre' },
      { id: 'alpha', title: 'Alpha' },
    ]
    expect(order(books, titleCompare)).toEqual(['alpha', 'eco', 'etude', 'zebre'])
  })

  it('breaks a title tie by volume number, a missing number counting as 0', () => {
    const books = [
      { id: 't3', title: 'One Piece', series_index: 3 },
      { id: 'tnone', title: 'One Piece' },
      { id: 't1', title: 'One Piece', series_index: 1 },
    ]
    expect(order(books, titleCompare)).toEqual(['tnone', 't1', 't3'])
  })

  it('returns 0 for the same title and the same volume', () => {
    expect(titleCompare({ title: 'A', series_index: 2 }, { title: 'A', series_index: 2 })).toBe(0)
  })
})

describe('finishedTime', () => {
  it('is 0 for a book without a finish date, so it sorts to the bottom', () => {
    expect(finishedTime({ date_finished: null })).toBe(0)
    expect(finishedTime({})).toBe(0)
  })

  it('is the timestamp of the finish date otherwise', () => {
    expect(finishedTime({ date_finished: '2024-05-03' })).toBe(Date.parse('2024-05-03'))
  })
})

describe('SORT_OPTIONS', () => {
  it('offers the seven sorts the menu relies on, each with a label', () => {
    expect(Object.keys(SORT_OPTIONS)).toEqual([
      'title',
      'author',
      'recent',
      'finished',
      'rating',
      'status',
      'tome',
    ])
    for (const option of Object.values(SORT_OPTIONS)) {
      expect(option.label).toBeTruthy()
      expect(typeof option.compare).toBe('function')
    }
  })

  it('author: sorts by the last word of the first author, then by title', () => {
    const books = [
      { id: 'orwell', title: '1984', author: ['George Orwell'] },
      { id: 'asimov2', title: 'Fondation', author: ['Isaac Asimov'] },
      { id: 'asimov1', title: 'Les Robots', author: ['Isaac Asimov'] },
      { id: 'sans', title: 'Anonyme', author: [] },
    ]
    // Sans auteur ("" comme clé) passe avant tous les autres.
    expect(order(books, SORT_OPTIONS.author.compare)).toEqual([
      'sans',
      'asimov2',
      'asimov1',
      'orwell',
    ])
  })

  it('recent: newest added first, a tie falling back to the title', () => {
    const books = [
      { id: 'old', title: 'A', created_at: '2024-01-01T10:00:00Z' },
      { id: 'newB', title: 'B', created_at: '2024-06-01T10:00:00Z' },
      { id: 'newA', title: 'A', created_at: '2024-06-01T10:00:00Z' },
    ]
    expect(order(books, SORT_OPTIONS.recent.compare)).toEqual(['newA', 'newB', 'old'])
  })

  it('finished: latest finish first, unfinished books last', () => {
    const books = [
      { id: 'none', title: 'A', date_finished: null },
      { id: 'early', title: 'B', date_finished: '2023-02-01' },
      { id: 'late', title: 'C', date_finished: '2024-02-01' },
    ]
    expect(order(books, SORT_OPTIONS.finished.compare)).toEqual(['late', 'early', 'none'])
  })

  it('rating: best rated first, an unrated book counting as 0', () => {
    const books = [
      { id: 'unrated', title: 'A', rating: null },
      { id: 'three', title: 'B', rating: 3 },
      { id: 'half', title: 'C', rating: 3.5 },
      { id: 'threeA', title: 'A', rating: 3 },
    ]
    expect(order(books, SORT_OPTIONS.rating.compare)).toEqual(['half', 'threeA', 'three', 'unrated'])
  })

  it('status: follows the reading progress order, then the title', () => {
    const books = [
      { id: 'read', title: 'A', status: 'read' },
      { id: 'wish', title: 'B', status: 'wishlist' },
      { id: 'reading', title: 'C', status: 'reading' },
      { id: 'toread', title: 'D', status: 'to-read' },
      { id: 'wishA', title: 'A', status: 'wishlist' },
    ]
    expect(order(books, SORT_OPTIONS.status.compare)).toEqual([
      'wishA',
      'wish',
      'toread',
      'reading',
      'read',
    ])
  })

  it('tome: groups by series first, then by volume, books without series first', () => {
    const books = [
      { id: 'b2', title: 'X', series: 'B', series_index: 2 },
      { id: 'a3', title: 'X', series: 'A', series_index: 3 },
      { id: 'none', title: 'Z', series: null },
      { id: 'a1', title: 'X', series: 'A', series_index: 1 },
      { id: 'b1', title: 'X', series: 'B', series_index: 1 },
    ]
    expect(order(books, SORT_OPTIONS.tome.compare)).toEqual(['none', 'a1', 'a3', 'b1', 'b2'])
  })
})

describe('letterGroupKey', () => {
  it('uses the uppercase first letter', () => {
    expect(letterGroupKey('dune')).toBe('D')
  })

  it('ignores accents, so E, É and Ê fall in the same group', () => {
    expect(letterGroupKey('Ecotopia')).toBe('E')
    expect(letterGroupKey('Étude')).toBe('E')
    expect(letterGroupKey('Êtes-vous')).toBe('E')
    expect(letterGroupKey('çà')).toBe('C')
  })

  it('gives the same key for a composed and a decomposed accent', () => {
    expect(letterGroupKey('Éluard')).toBe(letterGroupKey('Éluard'))
  })
})

describe('monthLabel', () => {
  it('writes the month and year in French', () => {
    expect(monthLabel(new Date(2024, 4, 15))).toBe('mai 2024')
    expect(monthLabel(new Date(2025, 0, 1))).toBe('janvier 2025')
  })
})

describe('groupKeyFor', () => {
  it('title: the first letter of the title', () => {
    expect(groupKeyFor({ title: 'Étude' }, 'title')).toBe('E')
  })

  it('author: the first letter of the last name, or "Auteur inconnu"', () => {
    expect(groupKeyFor({ author: ['Isaac Asimov'] }, 'author')).toBe('A')
    expect(groupKeyFor({ author: [] }, 'author')).toBe('Auteur inconnu')
    expect(groupKeyFor({}, 'author')).toBe('Auteur inconnu')
  })

  it('recent: the month the book was added', () => {
    expect(groupKeyFor({ created_at: '2024-03-10T12:00:00Z' }, 'recent')).toBe('mars 2024')
  })

  it('finished: the month it was finished, or "Non terminé"', () => {
    expect(groupKeyFor({ date_finished: '2024-05-03' }, 'finished')).toBe('mai 2024')
    expect(groupKeyFor({ date_finished: null }, 'finished')).toBe('Non terminé')
  })

  it('status: the status label, null for an unknown status', () => {
    expect(groupKeyFor({ status: 'read' }, 'status')).toBe('Lu')
    expect(groupKeyFor({ status: 'to-read' }, 'status')).toBe('PAL')
    expect(groupKeyFor({ status: 'bogus' }, 'status')).toBeNull()
  })

  it('rating: stars, with a half star when needed, "Non noté" when unrated', () => {
    expect(groupKeyFor({ rating: 3 }, 'rating')).toBe('★★★')
    expect(groupKeyFor({ rating: 3.5 }, 'rating')).toBe('★★★½')
    expect(groupKeyFor({ rating: 0.5 }, 'rating')).toBe('½')
    expect(groupKeyFor({ rating: 0 }, 'rating')).toBe('Non noté')
    expect(groupKeyFor({ rating: null }, 'rating')).toBe('Non noté')
  })

  it('tome: the series name, or "Sans série"', () => {
    expect(groupKeyFor({ series: 'Dune' }, 'tome')).toBe('Dune')
    expect(groupKeyFor({ series: null }, 'tome')).toBe('Sans série')
  })

  it('returns null for an unknown sort key', () => {
    expect(groupKeyFor({ title: 'X' }, 'bogus')).toBeNull()
  })
})
