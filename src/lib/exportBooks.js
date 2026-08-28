import Papa from 'papaparse'

const EXPORT_COLUMNS = [
  'title',
  'author',
  'translator',
  'illustrator',
  'publisher',
  'collection',
  'series',
  'series_index',
  'type',
  'universe',
  'tags',
  'status',
  'isbn',
  'date_started',
  'date_finished',
  'rating',
  'notes',
  'page_count',
  'price',
  'purchase_date',
  'created_at',
]

export function booksToCsv(books) {
  const rows = books.map((book) =>
    Object.fromEntries(
      EXPORT_COLUMNS.map((column) => {
        const value = book[column]
        return [column, Array.isArray(value) ? value.join(', ') : (value ?? '')]
      }),
    ),
  )
  return Papa.unparse(rows, { columns: EXPORT_COLUMNS })
}

export function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
