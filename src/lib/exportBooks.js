import Papa from 'papaparse'
import { toDateKey } from './dates'

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
  'favorite_quote',
  'page_count',
  'price',
  'purchase_date',
  'created_at',
]

// Colonnes de texte libre : les seules où un utilisateur (ou un fichier importé)
// peut écrire n'importe quoi. Les nombres, dates, ISBN et valeurs fixes (statut,
// type) ne sont pas touchés : un prix négatif doit rester -3.5.
const TEXT_COLUMNS = new Set([
  'title',
  'author',
  'translator',
  'illustrator',
  'publisher',
  'collection',
  'series',
  'universe',
  'tags',
  'notes',
  'favorite_quote',
])

// Un tableur lit comme une formule une cellule qui commence par = + - @ (ou
// une tabulation, un retour chariot) : un titre "=HYPERLINK(...)" serait
// exécuté à l'ouverture du fichier. Une apostrophe devant la force en texte.
const FORMULA_START = /^[=+\-@\t\r]/

function protectFromFormula(text) {
  return FORMULA_START.test(text) ? `'${text}` : text
}

export function booksToCsv(books) {
  const rows = books.map((book) =>
    Object.fromEntries(
      EXPORT_COLUMNS.map((column) => {
        const value = book[column]
        const cell = Array.isArray(value) ? value.join(', ') : (value ?? '')
        return [column, TEXT_COLUMNS.has(column) ? protectFromFormula(String(cell)) : cell]
      }),
    ),
  )
  // Papa Parse ne produit rien sans ligne de données : on écrit les noms de
  // colonnes soi-même pour qu'un export vide reste un fichier lisible.
  if (rows.length === 0) return EXPORT_COLUMNS.join(',')
  return Papa.unparse(rows, { columns: EXPORT_COLUMNS })
}

// Nom du fichier d'export, daté du jour LOCAL : toISOString() donne la date
// UTC, qui peut être celle de la veille ou du lendemain selon l'heure.
export function exportFileName(now = new Date()) {
  return `ex-libris-${toDateKey(now)}.csv`
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
