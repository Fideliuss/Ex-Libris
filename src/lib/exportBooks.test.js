import { describe, expect, it } from 'vitest'
import { booksToCsv } from './exportBooks'

describe('booksToCsv', () => {
  it('writes the header row in a fixed column order', () => {
    const csv = booksToCsv([{ title: 'X' }])
    const header = csv.split('\r\n')[0]
    expect(header).toBe(
      'title,author,translator,illustrator,publisher,collection,series,' +
        'series_index,type,universe,tags,status,isbn,date_started,' +
        'date_finished,rating,notes,favorite_quote,page_count,price,purchase_date,created_at',
    )
  })

  it('joins a tags array with a comma-space separator', () => {
    const csv = booksToCsv([
      { title: 'Fondation', tags: ['sf', 'classique'] },
    ])
    expect(csv).toContain('Fondation')
    expect(csv).toContain('sf, classique')
  })

  it('writes missing fields as empty cells, not "undefined" or "null"', () => {
    const csv = booksToCsv([{ title: 'Sans auteur' }])
    const dataRow = csv.split('\r\n')[1]
    expect(dataRow).not.toContain('undefined')
    expect(dataRow).not.toContain('null')
    // 22 columns total: title filled, the other 21 empty (21 commas)
    expect(dataRow).toBe('Sans auteur' + ','.repeat(21))
  })

  it('keeps the column order regardless of the input object key order', () => {
    const csv = booksToCsv([{ author: 'Hugo', title: 'Les Misérables' }])
    const dataRow = csv.split('\r\n')[1]
    expect(dataRow.startsWith('Les Misérables,Hugo,')).toBe(true)
  })
})
