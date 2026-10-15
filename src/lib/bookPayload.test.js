import { describe, expect, it } from 'vitest'
import { pickEditable } from './bookPayload'

describe('pickEditable', () => {
  it('drops database-managed columns and unknown keys', () => {
    const book = {
      id: 'x',
      user_id: 'u',
      created_at: 't',
      updated_at: 't',
      extra: 1,
      title: 'Dune',
      tags: ['sf'],
    }
    expect(pickEditable(book)).toEqual({ title: 'Dune', tags: ['sf'] })
  })

  it('keeps falsy values such as null and 0', () => {
    expect(pickEditable({ rating: 0, series: null })).toEqual({ rating: 0, series: null })
  })
})
