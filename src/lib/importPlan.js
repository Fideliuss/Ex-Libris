import { computeSeriesRepair } from './libibImport'

// Clé de rapprochement d'un livre : son ISBN s'il en a un, sinon titre +
// premier auteur (sans casse). Sans cette clé de repli, un livre sans ISBN
// serait ré-importé à chaque passage du même fichier.
export function importKey(book) {
  if (book.isbn) return `isbn:${book.isbn}`
  const title = (book.title ?? '').trim().toLowerCase()
  if (!title) return null
  const author = (book.author?.[0] ?? '').trim().toLowerCase()
  return `title:${title}|${author}`
}

// Décide quoi faire de chaque ligne d'un fichier d'import par rapport aux
// livres déjà présents : à créer, à compléter (réparation série/tome d'un
// livre existant), déjà à jour (ignoré) ou sans titre (ignoré).
// `rows` : [{ mapped, raw }] où `raw` est la ligne source (ou null).
export function planImport(rows, existingBooks) {
  const existingByKey = new Map()
  for (const book of existingBooks) {
    const key = importKey(book)
    if (key) existingByKey.set(key, book)
  }

  const toImport = []
  const toEnrich = []
  const seenInFile = new Set()
  let skipped = 0
  let untouchedDuplicates = 0

  for (const { mapped, raw } of rows) {
    if (!mapped.title) {
      skipped += 1
      continue
    }

    const key = importKey(mapped)
    const existing = key ? existingByKey.get(key) : null

    if (existing) {
      const patch = raw ? computeSeriesRepair(existing, raw) : null
      if (patch) {
        toEnrich.push({ id: existing.id, patch, title: existing.title })
      } else {
        untouchedDuplicates += 1
      }
      continue
    }

    if (key && seenInFile.has(key)) {
      untouchedDuplicates += 1
      continue
    }
    if (key) seenInFile.add(key)
    toImport.push(mapped)
  }

  return { toImport, toEnrich, untouchedDuplicates, skipped }
}
