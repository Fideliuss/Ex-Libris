import { describe, expect, it } from 'vitest'
import {
  STATUS_BADGE_CLASS,
  STATUS_BORDER_CLASS,
  STATUS_LABELS,
  STATUS_ORDER,
} from './statusLabels'

describe('status tables', () => {
  it('orders the statuses from the least to the most advanced', () => {
    expect(STATUS_ORDER).toEqual(['wishlist', 'to-read', 'reading', 'read'])
  })

  it('has a label, a border class and a badge class for every status', () => {
    for (const status of STATUS_ORDER) {
      expect(STATUS_LABELS[status]).toBeTruthy()
      expect(STATUS_BORDER_CLASS[status]).toBeTruthy()
      expect(STATUS_BADGE_CLASS[status]).toBeTruthy()
    }
  })

  it('keeps the three tables on exactly the same statuses', () => {
    const keys = (table) => Object.keys(table).sort()
    expect(keys(STATUS_BORDER_CLASS)).toEqual(keys(STATUS_LABELS))
    expect(keys(STATUS_BADGE_CLASS)).toEqual(keys(STATUS_LABELS))
  })
})
