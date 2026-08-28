import { describe, expect, it } from 'vitest'
import { utils, write } from 'xlsx'
import { mapMyLibraryRowToBook, parseMyLibraryXlsx } from './myLibraryImport'

describe('mapMyLibraryRowToBook', () => {
  it('extracts the series name and tome number from "Nom (tome N)"', () => {
    const book = mapMyLibraryRowToBook({ row: { Série: 'Angélique (tome 12)' }, type: 'book' })
    expect(book.series).toBe('Angélique')
    expect(book.series_index).toBe(12)
  })

  it('keeps the whole value as the series when there is no "(tome N)" suffix', () => {
    const book = mapMyLibraryRowToBook({ row: { Série: 'Le Seigneur des Anneaux' }, type: 'book' })
    expect(book.series).toBe('Le Seigneur des Anneaux')
    expect(book.series_index).toBeNull()
  })

  it('leaves series null when the field is empty', () => {
    const book = mapMyLibraryRowToBook({ row: { Série: '' }, type: 'book' })
    expect(book.series).toBeNull()
    expect(book.series_index).toBeNull()
  })

  it('maps "Lu" = "Oui" to read, anything else to to-read', () => {
    expect(mapMyLibraryRowToBook({ row: { Lu: 'Oui' }, type: 'book' }).status).toBe('read')
    expect(mapMyLibraryRowToBook({ row: { Lu: 'Non' }, type: 'book' }).status).toBe('to-read')
    expect(mapMyLibraryRowToBook({ row: {}, type: 'book' }).status).toBe('to-read')
  })

  it('parses a French start/end reading period into ISO dates', () => {
    const book = mapMyLibraryRowToBook({
      row: { 'Périodes de lecture': '27/05/2023 - 11/06/2023' },
      type: 'book',
    })
    expect(book.date_started).toBe('2023-05-27')
    expect(book.date_finished).toBe('2023-06-11')
  })

  it('treats a "?" side of the period as unknown (null)', () => {
    const book = mapMyLibraryRowToBook({
      row: { 'Périodes de lecture': '? - 17/02/2021' },
      type: 'book',
    })
    expect(book.date_started).toBeNull()
    expect(book.date_finished).toBe('2021-02-17')
  })

  it('leaves both dates null when the period is empty', () => {
    const book = mapMyLibraryRowToBook({ row: { 'Périodes de lecture': '' }, type: 'book' })
    expect(book.date_started).toBeNull()
    expect(book.date_finished).toBeNull()
  })

  it('splits and trims the comma-separated genres into tags', () => {
    const book = mapMyLibraryRowToBook({ row: { Genres: 'Fantasy, Aventure' }, type: 'book' })
    expect(book.tags).toEqual(['Fantasy', 'Aventure'])
  })

  it('carries the sheet type through and converts the page count', () => {
    const book = mapMyLibraryRowToBook({ row: { Pages: '320' }, type: 'bd' })
    expect(book.type).toBe('bd')
    expect(book.page_count).toBe(320)
  })
})

describe('parseMyLibraryXlsx', () => {
  it('reads the Livres and Bandes Dessinées sheets, tagging each row with its type', () => {
    const workbook = utils.book_new()
    utils.book_append_sheet(
      workbook,
      utils.json_to_sheet([{ Titre: 'Fondation' }]),
      'Livres',
    )
    utils.book_append_sheet(
      workbook,
      utils.json_to_sheet([{ Titre: 'Watchmen' }]),
      'Bandes Dessinées',
    )
    // A sheet outside Ex Libris' scope — must be ignored.
    utils.book_append_sheet(workbook, utils.json_to_sheet([{ Titre: 'Inception' }]), 'Films')

    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' })
    const rows = parseMyLibraryXlsx(buffer)

    expect(rows).toHaveLength(2)
    expect(rows).toContainEqual({ row: { Titre: 'Fondation' }, type: 'book' })
    expect(rows).toContainEqual({ row: { Titre: 'Watchmen' }, type: 'bd' })
  })

  it('skips a sheet that is entirely absent from the workbook', () => {
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, utils.json_to_sheet([{ Titre: 'Fondation' }]), 'Livres')
    const buffer = write(workbook, { type: 'array', bookType: 'xlsx' })

    expect(parseMyLibraryXlsx(buffer)).toEqual([{ row: { Titre: 'Fondation' }, type: 'book' }])
  })
})
