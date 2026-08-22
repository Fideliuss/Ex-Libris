import { useState } from 'react'
import { Link } from 'react-router-dom'
import { bulkCreateBooks, bulkUpdateBooks, listBooks } from '../lib/books'
import {
  computeSeriesRepair,
  mapLibibRowToBook,
  parseLibibCsv,
} from '../lib/libibImport'
import { useAuth } from '../context/AuthContext'
import { describeError } from '../lib/errors'
import { useGoBack } from '../lib/navigation'

export default function ImportLibib() {
  const { user } = useAuth()
  const goBack = useGoBack('/')
  const [step, setStep] = useState('idle') // idle | ready | importing | done
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState('')
  const [toImport, setToImport] = useState([])
  const [toEnrich, setToEnrich] = useState([])
  const [duplicateCount, setDuplicateCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [enrichedCount, setEnrichedCount] = useState(0)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setFileName(file.name)

    try {
      const text = await file.text()
      const rows = parseLibibCsv(text)
      const existingBooks = await listBooks()
      const existingByIsbn = new Map(
        existingBooks
          .filter((b) => b.isbn && b.user_id === user.id)
          .map((b) => [b.isbn, b]),
      )

      const nextToImport = []
      const nextToEnrich = []
      const seenInFile = new Set()
      let skipped = 0
      let untouchedDuplicates = 0

      for (const row of rows) {
        const mapped = mapLibibRowToBook(row)
        if (!mapped.title) {
          skipped += 1
          continue
        }

        const key = mapped.isbn || null
        const existing = key ? existingByIsbn.get(key) : null

        if (existing) {
          const patch = computeSeriesRepair(existing, row)
          if (patch) {
            nextToEnrich.push({ id: existing.id, patch, title: existing.title })
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
        nextToImport.push(mapped)
      }

      setToImport(nextToImport)
      setToEnrich(nextToEnrich)
      setDuplicateCount(untouchedDuplicates)
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
      if (toImport.length > 0) await bulkCreateBooks(toImport)
      if (toEnrich.length > 0) {
        await bulkUpdateBooks(
          toEnrich.map(({ id, patch }) => ({ id, patch })),
        )
      }
      setImportedCount(toImport.length)
      setEnrichedCount(toEnrich.length)
      setStep('done')
    } catch (err) {
      setError(describeError(err))
      setStep('ready')
    }
  }

  const hasWork = toImport.length > 0 || toEnrich.length > 0

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </button>

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
                navigateur. Tu peux réutiliser le même fichier plusieurs fois
                sans risque : les livres déjà présents ne sont jamais
                dupliqués.
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
                {toImport.length > 0 && (
                  <li>
                    <span className="font-mono">{toImport.length}</span>{' '}
                    nouveau{toImport.length > 1 ? 'x' : ''} livre
                    {toImport.length > 1 ? 's' : ''} à importer
                  </li>
                )}
                {toEnrich.length > 0 && (
                  <li>
                    <span className="font-mono">{toEnrich.length}</span> livre
                    {toEnrich.length > 1 ? 's' : ''} déjà présent
                    {toEnrich.length > 1 ? 's' : ''} — série/tome complété
                    {toEnrich.length > 1 ? 's' : ''}
                  </li>
                )}
                {duplicateCount > 0 && (
                  <li>
                    <span className="font-mono">{duplicateCount}</span> déjà
                    présent{duplicateCount > 1 ? 's' : ''} et à jour — ignoré
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

              {!hasWork ? (
                <p className="text-sm text-ink/60">
                  Rien à faire — ta collection est déjà à jour avec ce
                  fichier.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-sm bg-library text-white font-medium px-4 py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
                >
                  Continuer
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
              <div className="text-sm text-library space-y-1">
                {importedCount > 0 && (
                  <p>
                    <span className="font-mono">{importedCount}</span> livre
                    {importedCount > 1 ? 's' : ''} importé
                    {importedCount > 1 ? 's' : ''}.
                  </p>
                )}
                {enrichedCount > 0 && (
                  <p>
                    <span className="font-mono">{enrichedCount}</span> livre
                    {enrichedCount > 1 ? 's' : ''} mis à jour (série/tome).
                  </p>
                )}
              </div>
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
