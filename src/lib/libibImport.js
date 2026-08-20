import Papa from 'papaparse'

const STATUS_MAP = {
  'not begun': 'to-read',
  'in progress': 'reading',
  completed: 'read',
}

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

function dedupeCaseInsensitive(values) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result
}

export function mapLibibRowToBook(row) {
  const isbn = clean(row.ean_isbn13) || clean(row.upc_isbn10)
  const tags = dedupeCaseInsensitive(
    [clean(row.tags), clean(row.group)].filter(Boolean),
  )
  const status = STATUS_MAP[clean(row.status).toLowerCase()] ?? 'to-read'
  const rating = clean(row.rating)
  const pageCount = clean(row.length)
  const price = clean(row.price)

  return {
    title: clean(row.title),
    author: clean(row.creators),
    publisher: clean(row.publisher),
    isbn,
    description: clean(row.description),
    tags,
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
