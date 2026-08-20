import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createBook, deleteBook, getBook, listAllTags, updateBook } from '../lib/books'
import TagInput from '../components/TagInput'

const emptyBook = {
  title: '',
  author: '',
  publisher: '',
  isbn: '',
  cover_url: '',
  tags: [],
  status: 'to-read',
  date_started: '',
  date_finished: '',
  rating: 0,
  page_count: '',
  notes: '',
}

const inputClass =
  'w-full rounded-sm border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-library'

export default function BookForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [book, setBook] = useState(emptyBook)
  const [existingTags, setExistingTags] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    listAllTags().then(setExistingTags).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getBook(id)
      .then((data) =>
        setBook({
          ...emptyBook,
          ...data,
          date_started: data.date_started ?? '',
          date_finished: data.date_finished ?? '',
          rating: data.rating ?? 0,
          page_count: data.page_count ?? '',
        }),
      )
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function set(field, value) {
    setBook((b) => ({ ...b, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      ...book,
      date_started: book.date_started || null,
      date_finished: book.date_finished || null,
      page_count: book.page_count === '' ? null : Number(book.page_count),
      rating: book.rating || null,
    }
    try {
      if (isEdit) {
        await updateBook(id, payload)
      } else {
        await createBook(payload)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    setError(null)
    try {
      await deleteBook(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="font-mono text-sm text-ink/60">Chargement…</p>
      </div>
    )
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
          {isEdit ? 'Modifier le livre' : 'Ajouter un livre'}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6 space-y-5"
        >
          <Field label="Titre" required>
            <input
              required
              value={book.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Auteur">
            <input
              value={book.author ?? ''}
              onChange={(e) => set('author', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Éditeur">
            <input
              value={book.publisher ?? ''}
              onChange={(e) => set('publisher', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="ISBN">
            <input
              value={book.isbn ?? ''}
              onChange={(e) => set('isbn', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field label="Couverture (URL)">
            <input
              type="url"
              value={book.cover_url ?? ''}
              onChange={(e) => set('cover_url', e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </Field>

          <Field label="Tags">
            <TagInput
              value={book.tags ?? []}
              onChange={(tags) => set('tags', tags)}
              suggestions={existingTags}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Statut">
              <select
                value={book.status}
                onChange={(e) => set('status', e.target.value)}
                className={inputClass}
              >
                <option value="to-read">À lire</option>
                <option value="reading">En cours</option>
                <option value="read">Lu</option>
              </select>
            </Field>
            <Field label="Note">
              <StarRating
                value={book.rating}
                onChange={(v) => set('rating', v)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date de début">
              <input
                type="date"
                value={book.date_started ?? ''}
                onChange={(e) => set('date_started', e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Date de fin">
              <input
                type="date"
                value={book.date_finished ?? ''}
                onChange={(e) => set('date_finished', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Nombre de pages">
            <input
              type="number"
              min="0"
              value={book.page_count ?? ''}
              onChange={(e) => set('page_count', e.target.value)}
              className={`${inputClass} font-mono`}
            />
          </Field>

          <Field label="Notes">
            <textarea
              rows={4}
              value={book.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              className={inputClass}
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-stamp">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-sm bg-library text-white font-medium py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>

            {isEdit && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-sm border border-stamp/40 text-stamp px-4 py-2 text-sm hover:bg-stamp hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp"
              >
                Supprimer
              </button>
            )}
          </div>

          {isEdit && confirmingDelete && (
            <div className="border border-stamp/40 bg-stamp/5 rounded-sm p-4 flex items-center justify-between gap-3">
              <p className="text-sm text-stamp">
                Supprimer définitivement ce livre ?
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="text-sm px-3 py-1.5 rounded-sm border border-ink/20 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-sm px-3 py-1.5 rounded-sm bg-stamp text-white hover:bg-stamp/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-stamp"> *</span>}
      </span>
      {children}
    </label>
  )
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 h-[38px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className="text-xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
        >
          <span className={n <= value ? 'text-brass' : 'text-ink/20'}>★</span>
        </button>
      ))}
    </div>
  )
}
