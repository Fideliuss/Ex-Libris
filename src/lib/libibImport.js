import Papa from 'papaparse'

const STATUS_MAP = {
  'not begun': 'to-read',
  'in progress': 'reading',
  completed: 'read',
}

// Libib laisse parfois l'utilisateur préfixer le titre par le numéro de tome
// dans le champ "group" (série), ex: "2 - Fairy Dance".
const SERIES_INDEX_PATTERN = /^(\d+(?:\.\d+)?)\s*-\s*(.+)$/

export function parseLibibCsv(fileText) {
  const result = Papa.parse(fileText, { header: true, skipEmptyLines: true })
  if (result.errors.length > 0) {
    throw new Error(result.errors[0].message)
  }
  return result.data
}

function clean(value) {
  return (value ?? '').trim()
}

// Extrait un éventuel "N - " en tête de titre quand le livre appartient à une série.
function extractSeriesIndex(title, hasSeries) {
  if (!hasSeries) return { title, seriesIndex: null }
  const match = title.match(SERIES_INDEX_PATTERN)
  if (!match) return { title, seriesIndex: null }
  return { title: match[2].trim(), seriesIndex: Number(match[1]) }
}

export function mapLibibRowToBook(row) {
  const isbn = clean(row.ean_isbn13) || clean(row.upc_isbn10)
  const series = clean(row.group)
  const tags = clean(row.tags)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const status = STATUS_MAP[clean(row.status).toLowerCase()] ?? 'to-read'
  const rating = clean(row.rating)
  const pageCount = clean(row.length)
  const price = clean(row.price)
  const { title, seriesIndex } = extractSeriesIndex(
    clean(row.title),
    Boolean(series),
  )

  return {
    title,
    author: clean(row.creators),
    publisher: clean(row.publisher),
    isbn,
    description: clean(row.description),
    tags,
    series: series || null,
    series_index: seriesIndex,
    status,
    date_started: clean(row.began) || null,
    date_finished: clean(row.completed) || null,
    rating: rating ? Math.round(Number(rating)) : null,
    page_count: pageCount ? Number(pageCount) : null,
    price: price ? Number(price) : null,
    purchase_date: null,
    notes: clean(row.notes),
    cover_url: '',
  }
}

// Pour un livre déjà présent (même ISBN), calcule un patch pour compléter sa
// série/tome et nettoyer son titre/tags si le premier import (avant que ces
// champs existent) les avait mélangés. Retourne null si rien à changer.
export function computeSeriesRepair(existingBook, row) {
  const series = clean(row.group)
  if (!series) return null

  const patch = {}
  const rawTitle = clean(row.title)
  const { title: cleanTitle, seriesIndex } = extractSeriesIndex(rawTitle, true)

  if (!existingBook.series) {
    patch.series = series
  }
  if (seriesIndex != null && existingBook.series_index == null) {
    patch.series_index = seriesIndex
  }
  if (cleanTitle !== rawTitle && existingBook.title === rawTitle) {
    patch.title = cleanTitle
  }

  const seriesKey = series.toLowerCase()
  const currentTags = existingBook.tags ?? []
  if (currentTags.some((t) => t.toLowerCase() === seriesKey)) {
    patch.tags = currentTags.filter((t) => t.toLowerCase() !== seriesKey)
  }

  return Object.keys(patch).length > 0 ? patch : null
}
