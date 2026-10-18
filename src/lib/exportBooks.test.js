import Papa from 'papaparse'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { booksToCsv, exportFileName } from './exportBooks'

describe('exportFileName', () => {
  const originalTimeZone = process.env.TZ

  afterEach(() => {
    if (originalTimeZone === undefined) delete process.env.TZ
    else process.env.TZ = originalTimeZone
  })

  // Le fuseau est fixé dans chaque test : le résultat ne dépend pas de la
  // machine, et un nom construit avec toISOString() (UTC) serait détecté.
  it('is named after the local date', () => {
    process.env.TZ = 'Europe/Paris'
    expect(exportFileName(new Date(2026, 5, 15, 12, 0))).toBe('ex-libris-2026-06-15.csv')
  })

  it('keeps the local day late in the evening west of UTC (already the next day in UTC)', () => {
    process.env.TZ = 'America/Los_Angeles'
    expect(exportFileName(new Date(2026, 5, 15, 23, 59))).toBe('ex-libris-2026-06-15.csv')
  })

  it('keeps the local day just after midnight east of UTC (still the day before in UTC)', () => {
    process.env.TZ = 'Pacific/Auckland'
    expect(exportFileName(new Date(2026, 5, 16, 0, 1))).toBe('ex-libris-2026-06-16.csv')
  })

  it('defaults to today', () => {
    process.env.TZ = 'Europe/Paris'
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15, 12, 0))
    try {
      expect(exportFileName()).toBe('ex-libris-2026-06-15.csv')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('booksToCsv', () => {
  it('writes the header row in a fixed column order', () => {
    const csv = booksToCsv([{ title: 'X' }])
    const header = csv.split('\r\n')[0]
    expect(header).toBe(
      'title,author,translator,illustrator,publisher,collection,series,' +
        'series_index,hors_serie,type,universe,tags,status,isbn,date_started,' +
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
    // 23 colonnes : le titre rempli, 7 colonnes vides (auteur à numéro de tome),
    // "non" pour hors_serie, puis les 14 dernières colonnes vides.
    expect(dataRow).toBe('Sans auteur' + ','.repeat(7) + ',non' + ','.repeat(14))
  })

  it('writes the off-series flag as "oui" or "non", just after the volume number', () => {
    const header = booksToCsv([{ title: 'X' }]).split('\r\n')[0].split(',')
    expect(header.indexOf('hors_serie')).toBe(header.indexOf('series_index') + 1)
    const column = (book) => Papa.parse(booksToCsv([book]), { header: true }).data[0].hors_serie
    expect(column({ title: 'A', series: 'S', is_off_series: true })).toBe('oui')
    expect(column({ title: 'A', series: 'S', is_off_series: false })).toBe('non')
    expect(column({ title: 'A' })).toBe('non')
  })

  it('quotes values containing commas, double quotes or line breaks', () => {
    const csv = booksToCsv([
      { title: 'Un, deux', notes: 'dit "oui"', favorite_quote: 'ligne 1\nligne 2' },
    ])
    const dataRow = csv.split('\r\n').slice(1).join('\r\n')
    expect(dataRow).toContain('"Un, deux"')
    expect(dataRow).toContain('"dit ""oui"""')
    expect(dataRow).toContain('"ligne 1\nligne 2"')
  })

  it('writes one data row per book', () => {
    const csv = booksToCsv([{ title: 'A' }, { title: 'B' }, { title: 'C' }])
    expect(csv.split('\r\n')).toHaveLength(4) // en-tête + 3 livres
  })

  it('writes numbers as plain text, 0 included', () => {
    const dataRow = booksToCsv([{ title: 'X', rating: 0, page_count: 320, price: 12.5 }]).split('\r\n')[1]
    expect(dataRow).toContain(',0,')
    expect(dataRow).toContain('320')
    expect(dataRow).toContain('12.5')
  })

  it('keeps the column order regardless of the input object key order', () => {
    const csv = booksToCsv([{ author: ['Hugo'], title: 'Les Misérables' }])
    const dataRow = csv.split('\r\n')[1]
    expect(dataRow.startsWith('Les Misérables,Hugo,')).toBe(true)
  })
})

describe('booksToCsv with no book', () => {
  it('still writes the header row, so the file opens with its column names', () => {
    const header = booksToCsv([{ title: 'X' }]).split('\r\n')[0]
    expect(booksToCsv([])).toBe(header)
  })
})

// Relit le CSV produit, comme le ferait un tableur : une cellule qui commence
// par = + - @ (ou une tabulation, un retour chariot) y serait lue comme une
// formule. On vérifie ce que contient réellement chaque cellule.
const cell = (book, column) => Papa.parse(booksToCsv([book]), { header: true }).data[0][column]

describe('booksToCsv formula protection', () => {
  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'puts a quote in front of a text cell starting with %j',
    (trigger) => {
      expect(cell({ title: `${trigger}1+1` }, 'title')).toBe(`'${trigger}1+1`)
    },
  )

  it.each([
    'title',
    'publisher',
    'collection',
    'series',
    'universe',
    'notes',
    'favorite_quote',
  ])('protects the text column %s', (column) => {
    expect(cell({ [column]: '=HYPERLINK("http://x")' }, column)).toBe(`'=HYPERLINK("http://x")`)
  })

  it.each(['author', 'translator', 'illustrator', 'tags'])(
    'protects the list column %s, looking at the start of the joined cell',
    (column) => {
      expect(cell({ [column]: ['@home', 'autre'] }, column)).toBe("'@home, autre")
      expect(cell({ [column]: ['Dune', '=A1'] }, column)).toBe('Dune, =A1')
    },
  )

  it('leaves a text that merely contains those characters untouched', () => {
    expect(cell({ title: 'a=b' }, 'title')).toBe('a=b')
    expect(cell({ title: 'Dune - tome 1' }, 'title')).toBe('Dune - tome 1')
    expect(cell({ title: '1+1' }, 'title')).toBe('1+1')
  })

  it('leaves numbers, dates, identifiers and enumerations untouched, negative values included', () => {
    const book = {
      title: 'X',
      series_index: 3,
      rating: 0,
      page_count: 320,
      price: -3.5,
      isbn: '9782070360536',
      status: 'read',
      type: 'book',
      date_finished: '2024-05-03',
      created_at: '2024-05-03T10:00:00+00:00',
    }
    for (const [column, value] of Object.entries(book)) {
      expect(cell(book, column)).toBe(String(value))
    }
  })

  it('keeps an empty cell empty', () => {
    expect(cell({ title: 'X', notes: '' }, 'notes')).toBe('')
  })
})
