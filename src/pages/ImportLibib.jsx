import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bulkCreateBooks, listIsbns } from '../lib/books'
import { mapLibibRowToBook, parseLibibCsv } from '../lib/libibImport'

export default function ImportLibib() {
  const [step, setStep] = useState('idle') // idle | ready | importing | done
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [toImport, setToImport] = useState([])
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [importedCount, setImportedCount] = useState(0)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setFileName(file.name)

    try {
      const text = await file.text()
      const rows = parseLibibCsv(text)
      const books = rows.map(mapLibibRowToBook).filter((b) => b.title)
      const skipped = rows.length - books.length

      const existingIsbns = await listIsbns()
      const seenInFile = new Set()
      const unique = []
      let duplicates = 0
      for (const book of books) {
        const key = book.isbn || null
        if (key && (existingIsbns.has(key) || seenInFile.has(key))) {
          duplicates += 1
          continue
        }
        if (key) seenInFile.add(key)
        unique.push(book)
      }

      setToImport(unique)
      setDuplicateCount(duplicates)
      setSkippedCount(skipped)
      setStep('ready')
    } catch (err) {
      setError(`Impossible de lire ce fichier : ${err.message}`)
    }
  }

  async function handleImport() {
    setStep('importing')
    setError(null)
    try {
      await bulkCreateBooks(toImport)
      setImportedCount(toImport.length)
      setStep('done')
    } catch (err) {
      setError(err.message)
      setStep('ready')
    }
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-xl mx-auto">
        <Link
          to="/"
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </Link>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">
          Importer depuis Libib
        </h1>

        <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6 space-y-5">
          {step === 'idle' && (
            <>
              <p className="text-sm text-ink/70">
                Exporte ta bibliothèque depuis Libib au format CSV, puis
                sélectionne le fichier ici. Rien n'est envoyé ailleurs que
                vers ta base : le fichier est lu directement dans ton
                navigateur.
              </p>
              <label className="inline-block cursor-pointer rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-library">
                Choisir un fichier CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            </>
          )}

          {step === 'ready' && (
            <>
              <p className="text-sm text-ink/70">
                Fichier <span className="font-mono">{fileName}</span> lu.
              </p>
              <ul className="text-sm text-ink/70 space-y-1">
                <li>
                  <span className="font-mono">{toImport.length}</span> livre
                  {toImport.length > 1 ? 's' : ''} à importer
                </li>
                {duplicateCount > 0 && (
                  <li>
                    <span className="font-mono">{duplicateCount}</span> déjà
                    présent{duplicateCount > 1 ? 's' : ''} dans ta collection
                    (ISBN identique) — ignoré
                    {duplicateCount > 1 ? 's' : ''}
                  </li>
                )}
                {skippedCount > 0 && (
                  <li>
                    <span className="font-mono">{skippedCount}</span> ligne
                    {skippedCount > 1 ? 's' : ''} sans titre — ignorée
                    {skippedCount > 1 ? 's' : ''}
                  </li>
                )}
              </ul>

              {toImport.length === 0 ? (
                <p className="text-sm text-ink/60">
                  Rien à importer — tous les livres de ce fichier sont déjà
                  dans ta collection.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
                >
                  Importer {toImport.length} livre
                  {toImport.length > 1 ? 's' : ''}
                </button>
              )}
              <button
                type="button"
                onClick={() => setStep('idle')}
                className="block text-sm text-ink/50 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
              >
                Choisir un autre fichier
              </button>
            </>
          )}

          {step === 'importing' && (
            <p className="font-mono text-sm text-ink/60 text-center py-4">
              Import en cours…
            </p>
          )}

          {step === 'done' && (
            <>
              <p className="text-sm text-library">
                <span className="font-mono">{importedCount}</span> livre
                {importedCount > 1 ? 's' : ''} importé
                {importedCount > 1 ? 's' : ''} avec succès.
              </p>
              <Link
                to="/"
                className="inline-block rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
              >
                Voir ma collection
              </Link>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-stamp">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
