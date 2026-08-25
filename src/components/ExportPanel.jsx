import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listBooks } from '../lib/books'
import { booksToCsv, downloadTextFile } from '../lib/exportBooks'
import { describeError } from '../lib/errors'

export default function ExportPanel() {
  const { user } = useAuth()
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function handleExport() {
    setWorking(true)
    setError(null)
    try {
      const allBooks = await listBooks()
      const myBooks = allBooks.filter((b) => b.user_id === user.id)
      const csv = booksToCsv(myBooks)
      const date = new Date().toISOString().slice(0, 10)
      downloadTextFile(`ex-libris-${date}.csv`, csv, 'text/csv;charset=utf-8;')
    } catch (err) {
      setError(describeError(err))
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink/70">
        Télécharge tous tes livres (hors ceux de ton partenaire) dans un
        fichier CSV.
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={working}
        className="rounded-sm border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:border-library hover:text-library disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
      >
        {working ? 'Export…' : 'Exporter ma bibliothèque (CSV)'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-stamp">
          {error}
        </p>
      )}
    </div>
  )
}
