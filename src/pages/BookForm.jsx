import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createBook,
  deleteBook,
  getBook,
  listAllCollections,
  listAllEditions,
  listAllTags,
  updateBook,
} from '../lib/books'
import { lookupIsbn } from '../lib/isbnLookup'
import { uploadCover } from '../lib/storage'
import TagInput from '../components/TagInput'
import { inputClass } from '../lib/ui'
import { describeError } from '../lib/errors'
import { BOOK_TYPES } from '../lib/bookTypes'
import { useGoBack } from '../lib/navigation'
import LoadingScreen from '../components/LoadingScreen'
import BookCardVisual from '../components/BookCardVisual'
import { STATUS_BORDER_CLASS } from '../lib/statusLabels'

const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

const emptyBook = {
  title: '',
  author: '',
  translator: '',
  illustrator: '',
  publisher: '',
  collection: '',
  edition: '',
  isbn: '',
  cover_url: '',
  description: '',
  series: '',
  series_index: '',
  type: 'book',
  universe: '',
  tags: [],
  status: 'to-read',
  date_started: '',
  date_finished: '',
  rating: 0,
  page_count: '',
  notes: '',
  price: '',
  purchase_date: '',
}

export default function BookForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const goBack = useGoBack(isEdit ? `/books/${id}` : '/')

  const [book, setBook] = useState(emptyBook)
  const [existingTags, setExistingTags] = useState([])
  const [existingCollections, setExistingCollections] = useState([])
  const [existingEditions, setExistingEditions] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    listAllTags().then(setExistingTags).catch(() => {})
    listAllCollections().then(setExistingCollections).catch(() => {})
    listAllEditions().then(setExistingEditions).catch(() => {})
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
          price: data.price ?? '',
          purchase_date: data.purchase_date ?? '',
          series_index: data.series_index ?? '',
        }),
      )
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function set(field, value) {
    setBook((b) => ({ ...b, [field]: value }))
  }

  // Même critère que l'onglet « À compléter » de la collection et le
  // bandeau de la fiche livre (voir Collection.jsx / BookDetail.jsx) : les
  // champs qu'un scan ISBN réussi remplit normalement tout seul.
  const missingFields = [
    !book.cover_url && 'Couverture',
    !book.author && 'Auteur',
    !book.publisher && 'Éditeur',
    !book.page_count && 'Pages',
    !book.description && 'Résumé',
  ].filter(Boolean)

  async function handleLookup(isbnOverride) {
    const isbnToSearch = isbnOverride ?? book.isbn
    if (!isbnToSearch?.trim()) {
      setLookupMessage({ type: 'error', text: 'Saisis un ISBN avant de chercher.' })
      return
    }
    setLookupLoading(true)
    setLookupMessage(null)
    try {
      const result = await lookupIsbn(isbnToSearch)
      if (!result) {
        setLookupMessage({
          type: 'info',
          text: 'Aucun résultat trouvé pour cet ISBN. Remplis les champs manuellement.',
        })
      } else {
        setBook((b) => ({
          ...b,
          title: result.title || b.title,
          author: result.author || b.author,
          publisher: result.publisher || b.publisher,
          description: result.description || b.description,
          page_count: result.page_count ?? b.page_count,
          cover_url: result.cover_url || b.cover_url,
        }))
        setLookupMessage({ type: 'success', text: 'Livre trouvé, champs pré-remplis ci-dessous.' })
      }
    } catch {
      setLookupMessage({
        type: 'error',
        text: 'Erreur lors de la recherche. Réessaie ou remplis manuellement.',
      })
    } finally {
      setLookupLoading(false)
    }
  }

  function handleBarcodeDetected(code) {
    setScannerOpen(false)
    set('isbn', code)
    handleLookup(code)
  }

  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setCoverError('Le fichier doit être une image.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError('Image trop lourde (5 Mo maximum).')
      return
    }

    setCoverUploading(true)
    setCoverError(null)
    try {
      const url = await uploadCover(file)
      set('cover_url', url)
    } catch {
      setCoverError("Échec de l'import de l'image. Réessaie.")
    } finally {
      setCoverUploading(false)
    }
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
      price: book.price === '' ? null : Number(book.price),
      purchase_date: book.purchase_date || null,
      series: book.series?.trim() || null,
      series_index: book.series_index === '' ? null : Number(book.series_index),
      universe: book.universe?.trim() || null,
    }
    try {
      if (isEdit) {
        await updateBook(id, payload)
        // On revient en arrière (plutôt que naviguer vers la fiche) pour ne
        // pas empiler une entrée d'historique en plus de celle déjà créée
        // par le clic sur "Modifier" — sinon "Retour" depuis la fiche
        // atterrit sur ce formulaire fantôme au lieu de la collection.
        goBack()
      } else {
        await createBook(payload)
        navigate('/')
      }
    } catch (err) {
      setError(describeError(err))
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
      setError(describeError(err))
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto lg:flex lg:items-start lg:gap-8">
        <div className="max-w-xl mx-auto lg:mx-0 lg:flex-1 lg:min-w-0">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          {isEdit ? '← Retour à la fiche' : '← Retour à la collection'}
        </button>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">
          {isEdit ? 'Modifier le livre' : 'Ajouter un livre'}
        </h1>

        {missingFields.length > 0 ? (
          <p className="mb-4 rounded-sm border border-dashed border-brass/50 bg-brass/5 px-3 py-2 text-sm text-ink/70">
            <span className="font-medium text-brass">
              {missingFields.length} champ{missingFields.length > 1 ? 's' : ''} à
              compléter :
            </span>{' '}
            {missingFields.join(', ')}
          </p>
        ) : (
          <p className="mb-4 rounded-sm border border-library/30 bg-library/5 px-3 py-2 text-sm text-library">
            ✓ Fiche complète
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6 space-y-5"
        >
          <Field label="ISBN">
            <input
              value={book.isbn ?? ''}
              onChange={(e) => set('isbn', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleLookup()
                }
              }}
              inputMode="numeric"
              placeholder="978..."
              className={`${inputClass} font-mono`}
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleLookup()}
                disabled={lookupLoading}
                className="flex-1 rounded-sm bg-library-fill text-white px-3 py-2 text-sm font-medium hover:bg-library-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
              >
                {lookupLoading ? 'Recherche…' : 'Chercher'}
              </button>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="flex-1 rounded-sm border border-ink/20 text-ink/70 px-3 py-2 text-sm font-medium hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
              >
                Scanner
              </button>
            </div>
            {lookupMessage && (
              <p
                role="status"
                className={`text-sm mt-1.5 ${
                  lookupMessage.type === 'error'
                    ? 'text-stamp'
                    : lookupMessage.type === 'success'
                      ? 'text-library'
                      : 'text-ink/70'
                }`}
              >
                {lookupMessage.text}
              </p>
            )}
          </Field>

          <Field label="Titre" required>
            <input
              required
              value={book.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Type">
            <select
              value={book.type}
              onChange={(e) => set('type', e.target.value)}
              className={inputClass}
            >
              {Object.entries(BOOK_TYPES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          <FormSection title="Détails du livre" defaultOpen>
            <Field label="Auteur">
              <input
                value={book.author ?? ''}
                onChange={(e) => set('author', e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Traducteur">
                <input
                  value={book.translator ?? ''}
                  onChange={(e) => set('translator', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Dessinateur">
                <input
                  value={book.illustrator ?? ''}
                  onChange={(e) => set('illustrator', e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Éditeur">
              <input
                value={book.publisher ?? ''}
                onChange={(e) => set('publisher', e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Collection">
              <input
                value={book.collection ?? ''}
                onChange={(e) => set('collection', e.target.value)}
                placeholder="Folio SF, Champs…"
                list="collection-suggestions"
                className={inputClass}
              />
              <datalist id="collection-suggestions">
                {existingCollections.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>

            <Field label="Édition">
              <input
                value={book.edition ?? ''}
                onChange={(e) => set('edition', e.target.value)}
                placeholder="Poche, Grand format, Illustrée, Collector…"
                list="edition-suggestions"
                className={inputClass}
              />
              <datalist id="edition-suggestions">
                {existingEditions.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label="Série">
                  <input
                    value={book.series ?? ''}
                    onChange={(e) => set('series', e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Tome">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={book.series_index ?? ''}
                  onChange={(e) => set('series_index', e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>

            <Field label="Univers">
              <input
                value={book.universe ?? ''}
                onChange={(e) => set('universe', e.target.value)}
                placeholder="Hercule Poirot, Avengers, X-Men…"
                className={inputClass}
              />
            </Field>

            <Field label="Résumé">
              <textarea
                rows={4}
                value={book.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Rempli automatiquement par le lookup ISBN si disponible."
                className={inputClass}
              />
            </Field>

            <Field label="Couverture">
              <div className="flex gap-4 items-start">
                <div className="w-24 aspect-[2/3] shrink-0 rounded-sm border border-ink/10 bg-paper overflow-hidden flex items-center justify-center">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-ink/70 text-xs text-center px-1">
                      Aucune couverture
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="url"
                    value={book.cover_url ?? ''}
                    onChange={(e) => set('cover_url', e.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-library hover:text-library focus-within:outline-none focus-within:ring-2 focus-within:ring-library">
                      {coverUploading ? 'Import…' : 'Importer une image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleCoverUpload}
                        disabled={coverUploading}
                      />
                    </label>
                    <label className="cursor-pointer rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-library hover:text-library focus-within:outline-none focus-within:ring-2 focus-within:ring-library">
                      {coverUploading ? 'Import…' : 'Prendre une photo'}
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={handleCoverUpload}
                        disabled={coverUploading}
                      />
                    </label>
                    {book.cover_url && (
                      <button
                        type="button"
                        onClick={() => set('cover_url', '')}
                        className="text-sm text-ink/70 hover:text-stamp underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                  {coverError && (
                    <p role="alert" className="text-sm text-stamp">
                      {coverError}
                    </p>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Nombre de pages">
              <input
                type="number"
                min="0"
                value={book.page_count ?? ''}
                onChange={(e) => set('page_count', e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </Field>

            <Field label="Tags">
              <TagInput
                value={book.tags ?? []}
                onChange={(tags) => set('tags', tags)}
                suggestions={existingTags}
              />
            </Field>
          </FormSection>

          <FormSection title="Ma lecture" defaultOpen={isEdit}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Statut">
                <select
                  value={book.status}
                  onChange={(e) => set('status', e.target.value)}
                  className={inputClass}
                >
                  <option value="wishlist">Wishlist</option>
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

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date d'achat">
                <input
                  type="date"
                  value={book.purchase_date ?? ''}
                  onChange={(e) => set('purchase_date', e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Prix d'achat (€)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={book.price ?? ''}
                  onChange={(e) => set('price', e.target.value)}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Notes personnelles" defaultOpen={isEdit}>
            <Field label="Notes">
              <textarea
                rows={4}
                value={book.notes ?? ''}
                onChange={(e) => set('notes', e.target.value)}
                className={inputClass}
              />
            </Field>
          </FormSection>

          {error && (
            <p role="alert" className="text-sm text-stamp">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-sm bg-library-fill text-white font-medium py-2 text-sm hover:bg-library-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>

            {isEdit && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-sm border border-stamp/40 text-stamp px-4 py-2 text-sm hover:bg-stamp-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp"
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
                  className="text-sm px-3 py-1.5 rounded-sm border border-ink/20 hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-sm px-3 py-1.5 rounded-sm bg-stamp-fill text-white hover:bg-stamp-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp disabled:opacity-60"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

        <LivePreviewCard book={book} />
      </div>

      {scannerOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 bg-ink/90 flex flex-col items-center justify-center gap-3 p-4">
              <img src="/favicon.svg" alt="" className="w-10 h-10 animate-float" />
              <p className="font-mono text-sm text-white/80">
                Chargement du scanner…
              </p>
            </div>
          }
        >
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setScannerOpen(false)}
          />
        </Suspense>
      )}
    </div>
  )
}

// Aperçu "façon carte de la collection" (D1 angle C, partie 2 de la fiche
// de chantier) : retour visuel immédiat sur ce qui sera enregistré, mis à
// jour en direct pendant la saisie (avant même le premier scan ISBN).
function LivePreviewCard({ book }) {
  // BookCardVisual attend un titre pour afficher une ligne correcte : un
  // champ vide donnerait un <p> vide plutôt qu'un vrai placeholder, d'où le
  // fallback local (comportement propre à cet aperçu, pas à la vraie carte).
  const previewBook = { ...book, title: book.title || 'Titre à renseigner' }
  return (
    // Collée à droite du formulaire (colonne sticky, même pattern que la
    // barre latérale de /account) plutôt qu'insérée dans le flux du
    // formulaire (encombrant sur un long formulaire vertical) ou un simple
    // fixed calé sur le viewport (se détache visuellement du formulaire sur
    // un écran large). Réservée au desktop : pas de place à côté du
    // formulaire sur un écran étroit.
    <div className="hidden lg:block lg:w-44 lg:shrink-0 lg:sticky lg:top-24">
      <p className="font-mono text-xs tracking-widest text-library uppercase mb-2">
        Aperçu
      </p>
      <div
        className={`relative bg-card border-t-4 border-dashed rounded-sm shadow-lg overflow-hidden ${STATUS_BORDER_CLASS[book.status]}`}
      >
        <BookCardVisual book={previewBook} />
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

// Section repliable pour regrouper les champs secondaires (formulaire
// d'ajout/édition, "Angle C" de la fiche de chantier D1) : ISBN/Titre/Type
// restent toujours visibles hors section, le reste se range par thème pour
// réduire la densité visuelle sans rien cacher définitivement.
function FormSection({ title, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  // grid-template-rows en classe Tailwind (grid-rows-[0fr]/[1fr]) ne se
  // recalculait pas de façon fiable au toggle dans les tests : la même
  // propriété posée en style inline fonctionne correctement, donc on passe
  // par là plutôt que par une classe pour cette propriété précise.
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return (
    <div className="border-t border-ink/10 pt-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center justify-between w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
      >
        <span className="font-serif text-lg font-semibold">{title}</span>
        <span aria-hidden="true" className="text-ink/70">
          {open ? '▴' : '▾'}
        </span>
      </button>
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: reduceMotion ? 'none' : 'grid-template-rows 300ms ease-out',
        }}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="space-y-5 pt-4">{children}</div>
        </div>
      </div>
    </div>
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
