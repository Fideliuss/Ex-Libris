import { describe, expect, it } from 'vitest'
import { importKey, planImport } from './importPlan'

const row = (mapped, raw = null) => ({ mapped, raw })

describe('importKey', () => {
  it('prefers the ISBN', () => {
    expect(importKey({ isbn: '123', title: 'X' })).toBe('isbn:123')
  })

  it('falls back to title and first author, ignoring case and padding', () => {
    expect(importKey({ isbn: '', title: ' Dune ', author: [' Frank Herbert '] })).toBe(
      'title:dune|frank herbert',
    )
  })

  it('has no key without ISBN nor title', () => {
    expect(importKey({ isbn: '', title: '' })).toBeNull()
  })
})

describe('planImport', () => {
  it('imports new books and skips rows without a title', () => {
    const plan = planImport(
      [row({ title: 'A', isbn: '1' }), row({ title: '', isbn: '2' })],
      [],
    )
    expect(plan.toImport).toHaveLength(1)
    expect(plan.skipped).toBe(1)
  })

  it('ignores a book already present by ISBN', () => {
    const plan = planImport([row({ title: 'A', isbn: '1' })], [{ id: 'x', title: 'A', isbn: '1' }])
    expect(plan.toImport).toHaveLength(0)
    expect(plan.untouchedDuplicates).toBe(1)
  })

  it('does not re-import a book without ISBN already present by title and author', () => {
    const existing = [{ id: 'x', title: 'Dune', author: ['Frank Herbert'], isbn: '' }]
    const plan = planImport([row({ title: 'dune', author: ['Frank Herbert'], isbn: '' })], existing)
    expect(plan.toImport).toHaveLength(0)
    expect(plan.untouchedDuplicates).toBe(1)
  })

  it('keeps two same-title books by different authors', () => {
    const existing = [{ id: 'x', title: 'Dune', author: ['A'], isbn: '' }]
    const plan = planImport([row({ title: 'Dune', author: ['B'], isbn: '' })], existing)
    expect(plan.toImport).toHaveLength(1)
  })

  it('drops duplicates inside the file itself', () => {
    const plan = planImport(
      [row({ title: 'A', isbn: '1' }), row({ title: 'A', isbn: '1' })],
      [],
    )
    expect(plan.toImport).toHaveLength(1)
    expect(plan.untouchedDuplicates).toBe(1)
  })

  it('completes series and volume of an existing Libib book', () => {
    const existing = [{ id: 'x', title: 'T', isbn: '1', series: null, series_index: null, tags: [] }]
    const raw = { title: '2 - T', group: 'Saga' }
    const plan = planImport([row({ title: 'T', isbn: '1' }, raw)], existing)
    expect(plan.toEnrich).toEqual([{ id: 'x', title: 'T', patch: { series: 'Saga', series_index: 2 } }])
  })
})
