import { describe, expect, it } from 'vitest'
import { bookSuggestions } from './bookSuggestions'

describe('bookSuggestions', () => {
  it('collects distinct sorted values per field and skips empties', () => {
    const books = [
      { tags: ['sf', 'aventure'], author: ['B', 'A'], publisher: 'P', collection: '', series: 'S' },
      { tags: ['sf'], author: null, publisher: 'P', translator: ['T'], universe: 'U' },
    ]
    expect(bookSuggestions(books)).toEqual({
      tags: ['aventure', 'sf'],
      authors: ['A', 'B'],
      translators: ['T'],
      illustrators: [],
      collections: [],
      publishers: ['P'],
      series: ['S'],
      universes: ['U'],
    })
  })
})
