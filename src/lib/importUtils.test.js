import { describe, expect, it } from 'vitest'
import { clean, splitList } from './importUtils'

describe('importUtils', () => {
  it('cleans nullish and padded values', () => {
    expect(clean(null)).toBe('')
    expect(clean('  x ')).toBe('x')
    expect(clean(42)).toBe('42')
  })

  it('splits a comma list, trimming and dropping empties', () => {
    expect(splitList(' a, b , ,c ')).toEqual(['a', 'b', 'c'])
    expect(splitList(undefined)).toEqual([])
  })
})
