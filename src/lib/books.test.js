import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabaseClient', async () => {
  const { createFakeSupabase } = await import('../test/fakeSupabase')
  return { supabase: createFakeSupabase() }
})

import { supabase as fake } from './supabaseClient'
import {
  bulkCreateBooks,
  bulkDeleteBooks,
  bulkSetField,
  bulkUpdateBooks,
  convertTagToCollection,
  createBook,
  deleteBook,
  getBook,
  getSeriesSiblings,
  listBooks,
  renameCollection,
  renamePublisher,
  renameSeries,
  updateBook,
} from './books'

const ops = (call) => fake.opsOf(call)
const OWN_COVER = 'https://abc.supabase.co/storage/v1/object/public/covers/user-1/a.webp'
const ok = { data: null, error: null }
const boom = { data: null, error: { message: 'boom' } }

beforeEach(() => fake.reset())

describe('listBooks', () => {
  it('reads every visible book, newest first, in pages of 1000', async () => {
    fake.queue('books', { data: [{ id: 'a' }], error: null })
    expect(await listBooks()).toEqual([{ id: 'a' }])
    expect(ops(fake.state.calls[0])).toEqual([
      ['select', '*'],
      ['order', 'created_at', { ascending: false }],
      ['range', 0, 999],
    ])
  })

  it('filters on the owner when a user id is given', async () => {
    fake.queue('books', { data: [], error: null })
    await listBooks({ userId: 'u2' })
    expect(ops(fake.state.calls[0])).toContainEqual(['eq', 'user_id', 'u2'])
  })

  it('asks for the next page while pages come back full, and stops on a short one', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ id: `p1-${i}` }))
    fake.queue('books', { data: full, error: null }, { data: [{ id: 'last' }], error: null })
    const books = await listBooks()
    expect(books).toHaveLength(1001)
    expect(fake.state.calls).toHaveLength(2)
    expect(ops(fake.state.calls[1])).toContainEqual(['range', 1000, 1999])
  })

  it('throws the database error', async () => {
    fake.queue('books', boom)
    await expect(listBooks()).rejects.toEqual({ message: 'boom' })
  })
})

describe('createBook', () => {
  it('inserts the book under the signed-in user and returns the stored row', async () => {
    fake.queue('books', { data: { id: 'new', title: 'Dune' }, error: null })
    const saved = await createBook({ title: 'Dune' })
    expect(saved).toEqual({ id: 'new', title: 'Dune' })
    expect(ops(fake.state.calls[0])[0]).toEqual(['insert', { title: 'Dune', user_id: 'user-1' }])
  })

  it('refuses to run without a session', async () => {
    fake.state.session = null
    await expect(createBook({ title: 'X' })).rejects.toThrow('Session expirée')
    expect(fake.state.calls).toHaveLength(0)
  })

  it('throws the database error', async () => {
    fake.queue('books', boom)
    await expect(createBook({ title: 'X' })).rejects.toEqual({ message: 'boom' })
  })
})

describe('updateBook and getBook', () => {
  it('updateBook patches one book by id and returns it', async () => {
    fake.queue('books', { data: { id: 'b1', rating: 4 }, error: null })
    expect(await updateBook('b1', { rating: 4 })).toEqual({ id: 'b1', rating: 4 })
    expect(ops(fake.state.calls[0])).toEqual([
      ['update', { rating: 4 }],
      ['eq', 'id', 'b1'],
      ['select'],
      ['single'],
    ])
  })

  it('getBook reads one book by id', async () => {
    fake.queue('books', { data: { id: 'b1' }, error: null })
    expect(await getBook('b1')).toEqual({ id: 'b1' })
    expect(ops(fake.state.calls[0])).toEqual([['select', '*'], ['eq', 'id', 'b1'], ['single']])
  })

  it('both throw the database error', async () => {
    fake.queue('books', boom, boom)
    await expect(updateBook('b1', {})).rejects.toEqual({ message: 'boom' })
    await expect(getBook('b1')).rejects.toEqual({ message: 'boom' })
  })
})

describe('deleteBook', () => {
  it('deletes the book and its own cover from storage', async () => {
    fake.queue('books', { data: { cover_url: OWN_COVER }, error: null })
    await deleteBook('b1')
    expect(ops(fake.state.calls[0])).toEqual([
      ['delete'],
      ['eq', 'id', 'b1'],
      ['select', 'cover_url'],
      ['single'],
    ])
    expect(fake.removed).toEqual([{ bucket: 'covers', paths: ['user-1/a.webp'] }])
  })

  it('leaves an external cover alone', async () => {
    fake.queue('books', { data: { cover_url: 'https://books.google.com/x.jpg' }, error: null })
    await deleteBook('b1')
    expect(fake.removed).toEqual([])
  })

  it('does not touch storage when the book could not be deleted', async () => {
    fake.queue('books', boom)
    await expect(deleteBook('b1')).rejects.toEqual({ message: 'boom' })
    expect(fake.removed).toEqual([])
  })
})

describe('getSeriesSiblings', () => {
  it('reads the other volumes of the series of the same owner, regular volumes first then off-series books, each in number order', async () => {
    fake.queue('books', { data: [{ id: 'a', series_index: 1 }], error: null })
    expect(await getSeriesSiblings('Dune', 'u1')).toEqual([{ id: 'a', series_index: 1 }])
    expect(ops(fake.state.calls[0])).toEqual([
      ['select', 'id, series_index, status, is_off_series'],
      ['eq', 'series', 'Dune'],
      ['eq', 'user_id', 'u1'],
      ['order', 'is_off_series', { ascending: true }],
      ['order', 'series_index', { ascending: true, nullsFirst: false }],
    ])
  })

  it('throws the database error', async () => {
    fake.queue('books', boom)
    await expect(getSeriesSiblings('Dune', 'u1')).rejects.toEqual({ message: 'boom' })
  })
})

describe('bulkCreateBooks', () => {
  const rows = (n) => Array.from({ length: n }, (_, i) => ({ title: `L${i}` }))

  it('stamps every row with the signed-in user', async () => {
    await bulkCreateBooks(rows(2))
    const [, inserted] = ops(fake.state.calls[0])[0]
    expect(inserted).toEqual([
      { title: 'L0', user_id: 'user-1' },
      { title: 'L1', user_id: 'user-1' },
    ])
  })

  it('inserts by chunks of 100', async () => {
    await bulkCreateBooks(rows(250))
    const sizes = fake.state.calls.map((c) => ops(c)[0][1].length)
    expect(sizes).toEqual([100, 100, 50])
  })

  it('stops at the first failing chunk', async () => {
    fake.queue('books', ok, boom)
    await expect(bulkCreateBooks(rows(250))).rejects.toEqual({ message: 'boom' })
    expect(fake.state.calls).toHaveLength(2)
  })

  it('sends nothing for an empty list', async () => {
    await bulkCreateBooks([])
    expect(fake.state.calls).toHaveLength(0)
  })
})

describe('bulkUpdateBooks', () => {
  const updates = (n) => Array.from({ length: n }, (_, i) => ({ id: `b${i}`, patch: { rating: i } }))

  it('sends one update per book, each with its own patch', async () => {
    await bulkUpdateBooks(updates(3))
    expect(fake.state.calls.map((c) => ops(c))).toEqual([
      [['update', { rating: 0 }], ['eq', 'id', 'b0']],
      [['update', { rating: 1 }], ['eq', 'id', 'b1']],
      [['update', { rating: 2 }], ['eq', 'id', 'b2']],
    ])
  })

  it('runs them in parallel waves of 8, never more at once', async () => {
    await bulkUpdateBooks(updates(20))
    expect(fake.state.calls).toHaveLength(20)
    expect(fake.state.maxInFlight).toBe(8)
  })

  it('throws the first error of a wave and does not start the next one', async () => {
    fake.queue('books', ok, ok, boom)
    await expect(bulkUpdateBooks(updates(20))).rejects.toEqual({ message: 'boom' })
    expect(fake.state.calls).toHaveLength(8)
  })

  it('sends nothing for an empty list', async () => {
    await bulkUpdateBooks([])
    expect(fake.state.calls).toHaveLength(0)
  })
})

describe('bulkSetField', () => {
  it('sets the same value on every selected book with a single request', async () => {
    await bulkSetField(['a', 'b', 'c'], { status: 'read' })
    expect(fake.state.calls).toHaveLength(1)
    expect(ops(fake.state.calls[0])).toEqual([
      ['update', { status: 'read' }],
      ['in', 'id', ['a', 'b', 'c']],
    ])
  })

  it('does nothing without any id', async () => {
    await bulkSetField([], { status: 'read' })
    expect(fake.state.calls).toHaveLength(0)
  })

  it('throws the database error', async () => {
    fake.queue('books', boom)
    await expect(bulkSetField(['a'], {})).rejects.toEqual({ message: 'boom' })
  })
})

describe('bulkDeleteBooks', () => {
  it('deletes the selected books and the covers we host, skipping the others', async () => {
    fake.queue('books', {
      data: [
        { cover_url: OWN_COVER },
        { cover_url: 'https://books.google.com/x.jpg' },
        { cover_url: null },
      ],
      error: null,
    })
    await bulkDeleteBooks(['a', 'b', 'c'])
    expect(ops(fake.state.calls[0])).toEqual([
      ['delete'],
      ['in', 'id', ['a', 'b', 'c']],
      ['select', 'cover_url'],
    ])
    expect(fake.removed).toEqual([{ bucket: 'covers', paths: ['user-1/a.webp'] }])
  })

  it('throws the database error and keeps storage untouched', async () => {
    fake.queue('books', boom)
    await expect(bulkDeleteBooks(['a'])).rejects.toEqual({ message: 'boom' })
    expect(fake.removed).toEqual([])
  })
})

describe('convertTagToCollection', () => {
  it('moves the tag into the collection field of every book that carries it', async () => {
    fake.queue('books', {
      data: [
        { id: '1', tags: ['folio sf', 'sf'] },
        { id: '2', tags: ['folio sf'] },
      ],
      error: null,
    })
    expect(await convertTagToCollection('folio sf')).toBe(2)

    expect(ops(fake.state.calls[0])).toEqual([
      ['select', 'id, tags'],
      ['eq', 'user_id', 'user-1'],
      ['contains', 'tags', ['folio sf']],
      ['range', 0, 999],
    ])
    expect(ops(fake.state.calls[1])).toEqual([
      ['update', { collection: 'folio sf', tags: ['sf'] }],
      ['eq', 'id', '1'],
    ])
    expect(ops(fake.state.calls[2])).toEqual([
      ['update', { collection: 'folio sf', tags: [] }],
      ['eq', 'id', '2'],
    ])
  })

  it('does nothing and returns 0 when no book carries the tag', async () => {
    fake.queue('books', { data: [], error: null })
    expect(await convertTagToCollection('absent')).toBe(0)
    expect(fake.state.calls).toHaveLength(1)
  })

  it('stops with the database error', async () => {
    fake.queue('books', boom)
    await expect(convertTagToCollection('x')).rejects.toEqual({ message: 'boom' })
  })
})

describe('renaming a publisher, a collection or a series', () => {
  it.each([
    ['publisher', renamePublisher],
    ['collection', renameCollection],
    ['series', renameSeries],
  ])('%s: renames it on the signed-in user\'s books only', async (field, rename) => {
    await rename('Ancien', 'Nouveau')
    expect(ops(fake.state.calls[0])).toEqual([
      ['update', { [field]: 'Nouveau' }],
      ['eq', 'user_id', 'user-1'],
      ['eq', field, 'Ancien'],
    ])
  })

  it('throws the database error', async () => {
    fake.queue('books', boom)
    await expect(renameSeries('A', 'B')).rejects.toEqual({ message: 'boom' })
  })

  it('refuses to run without a session', async () => {
    fake.state.session = null
    await expect(renamePublisher('A', 'B')).rejects.toThrow('Session expirée')
    expect(fake.state.calls).toHaveLength(0)
  })
})
