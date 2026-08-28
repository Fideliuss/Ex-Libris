import { read, utils } from 'xlsx'

// Les deux seules feuilles avec des données dans un export "My Library" —
// les autres (listes de souhaits, Films, Jeux Vidéo, Musique) sont hors
// scope, Ex Libris ne suit que livres/BD/comics/mangas.
const SHEETS = [
  { name: 'Livres', type: 'book' },
  { name: 'Bandes Dessinées', type: 'bd' },
]

// "Angélique (tome 12)" -> série "Angélique", tome 12.
const SERIES_PATTERN = /^(.*?)\s*\(tome\s*(\d+)\)$/i

function clean(value) {
  if (value == null) return ''
  return String(value).trim()
}

function parseFrenchDate(str) {
  const match = clean(str).match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, d, m, y] = match
  return `${y}-${m}-${d}`
}

// "27/05/2023 - 11/06/2023" -> dates de début/fin ; "?" pour un côté
// inconnu (ex: "? - 17/02/2021") donne null pour ce côté.
function parsePeriod(value) {
  const str = clean(value)
  if (!str) return { started: null, finished: null }
  const [startRaw, endRaw] = str.split('-').map((s) => s.trim())
  return {
    started: parseFrenchDate(startRaw),
    finished: parseFrenchDate(endRaw),
  }
}

function extractSeries(raw) {
  const value = clean(raw)
  if (!value) return { series: null, seriesIndex: null }
  const match = value.match(SERIES_PATTERN)
  if (!match) return { series: value, seriesIndex: null }
  return { series: match[1].trim(), seriesIndex: Number(match[2]) }
}

export function parseMyLibraryXlsx(arrayBuffer) {
  const workbook = read(arrayBuffer, { type: 'array' })
  const rows = []
  for (const { name, type } of SHEETS) {
    const sheet = workbook.Sheets[name]
    if (!sheet) continue
    for (const row of utils.sheet_to_json(sheet, { defval: '' })) {
      rows.push({ row, type })
    }
  }
  return rows
}

export function mapMyLibraryRowToBook({ row, type }) {
  const { series, seriesIndex } = extractSeries(row['Série'])
  const tags = clean(row['Genres'])
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const status = clean(row['Lu']).toLowerCase() === 'oui' ? 'read' : 'to-read'
  const { started, finished } = parsePeriod(row['Périodes de lecture'])
  const pageCount = clean(row['Pages'])

  return {
    title: clean(row['Titre']),
    author: clean(row['Auteurs']),
    publisher: clean(row['Editeur']),
    isbn: clean(row['ISBN']),
    description: clean(row['Résumé']),
    tags,
    series,
    series_index: seriesIndex,
    type,
    status,
    date_started: started,
    date_finished: finished,
    rating: null,
    page_count: pageCount ? Number(pageCount) : null,
    price: null,
    purchase_date: null,
    notes: clean(row['Commentaires']),
    cover_url: '',
  }
}
