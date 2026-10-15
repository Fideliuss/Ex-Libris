import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBook, deleteBook, getBook, updateBook } from '../lib/books'
import { useAuth } from '../context/AuthContext'
import { useLibraryData } from '../hooks/useLibraryData'
import { bookSuggestions } from '../lib/bookSuggestions'
import { lookupIsbn } from '../lib/isbnLookup'
import { getMissingFields } from '../lib/bookCompleteness'
import { compressImage, deleteCover, uploadCover } from '../lib/storage'
import TagInput from '../components/TagInput'
import { inputClass, primaryButtonClass, secondaryButtonClass, dangerOutlineButtonClass, backLinkClass, cardClass } from '../lib/ui'
import { describeError } from '../lib/errors'
import { BOOK_TYPES } from '../lib/bookTypes'
import { useGoBack } from '../lib/navigation'
import LoadingScreen from '../components/LoadingScreen'
import InlineConfirm from '../components/InlineConfirm'
import SuggestInput from '../components/SuggestInput'
import EditionCheckboxes from '../components/EditionCheckboxes'
import QuickPurchaseModal from '../components/QuickPurchaseModal'
import StarRating from '../components/StarRating'
import CoverLightbox from '../components/CoverLightbox'
import { STATUS_LABELS } from '../lib/statusLabels'
import { Field, FormSection, LivePreviewCard, WishlistCheckbox } from '../components/BookFormParts'
import { nullIfEmpty, pickEditable } from '../lib/bookPayload'

const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

// Exclut explicitement HEIC/HEIF (photos par défaut sur iPhone) : le canvas
// de compressImage ne sait pas les décoder sur Chrome/Firefox. C'est un
// indice pour le sélecteur de fichier du système, pas une garantie — le
// glisser-déposer l'ignore et compressImage reste la vraie barrière.
const COVER_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp'

const emptyBook = {
  title: '',
  author: [],
  translator: [],
  illustrator: [],
  publisher: '',
  collection: '',
  edition: [],
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
  favorite_quote: '',
  price: '',
  purchase_date: '',
}

export default function BookForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const goBack = useGoBack(isEdit ? `/books/${id}` : '/')

  const [book, setBook] = useState(emptyBook)
  const { user } = useAuth()
  const { allBooks, upsertBook, removeBook } = useLibraryData()
  // Suggestions de saisie dérivées du cache partagé (mes livres seulement),
  // sans requête réseau supplémentaire à l'ouverture du formulaire.
  const suggestions = useMemo(
    () => bookSuggestions(allBooks.filter((b) => b.user_id === user?.id)),
    [allBooks, user?.id],
  )
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupMessage, setLookupMessage] = useState(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [showPurchasePrompt, setShowPurchasePrompt] = useState(false)
  const [coverExpanded, setCoverExpanded] = useState(false)
  const [coverDragActive, setCoverDragActive] = useState(false)
  const coverFileInputRef = useRef(null)
  // Valeur en base au chargement de la fiche, indépendante des éditions en
  // cours dans book.cover_url — sert à savoir, à la sauvegarde, si la cover
  // a changé et si l'ancien fichier (remplacé ou retiré) doit être nettoyé
  // du storage.
  const originalCoverUrlRef = useRef(null)
  // L'upload réel vers le storage n'a lieu qu'à la sauvegarde (handleSubmit),
  // pas au choix du fichier : sinon quitter la page sans enregistrer laisse
  // un fichier orphelin en storage (bug réel rencontré). En attendant, on
  // affiche un aperçu 100% local (URL.createObjectURL, aucun réseau) et on
  // garde le blob compressé de côté pour l'upload différé.
  const pendingCoverBlobRef = useRef(null)
  const pendingCoverPreviewUrlRef = useRef(null)

  function clearPendingCover() {
    if (pendingCoverPreviewUrlRef.current) {
      URL.revokeObjectURL(pendingCoverPreviewUrlRef.current)
      pendingCoverPreviewUrlRef.current = null
    }
    pendingCoverBlobRef.current = null
  }

  // Révoque l'aperçu local en attente si la page est quittée sans avoir
  // soumis le formulaire (fermeture d'onglet ou navigation SPA) : pas
  // d'impact storage (rien n'a été uploadé), juste l'hygiène mémoire du
  // blob local.
  useEffect(() => {
    return () => {
      if (pendingCoverPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingCoverPreviewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getBook(id)
      .then((data) => {
        originalCoverUrlRef.current = data.cover_url ?? null
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
          edition: data.edition ?? [],
          author: data.author ?? [],
          translator: data.translator ?? [],
          illustrator: data.illustrator ?? [],
        })
      })
      .catch((err) => setError(describeError(err)))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function set(field, value) {
    setBook((b) => ({ ...b, [field]: value }))
  }

  // Décocher "Je le veux" propose de noter prix/date d'achat tout de suite
  // (même modal que sur la fiche livre quand un statut sort de la wishlist,
  // voir QuickPurchaseModal) — mais volontairement PAS depuis le sélecteur
  // complet dans "Ma lecture" plus bas, qui reste un simple changement de
  // statut sans interruption. Et seulement en édition : à l'ajout, le livre
  // n'existe pas encore, interrompre la saisie pour ça est prématuré.
  function handleWishlistToggle(checked) {
    set('status', checked ? 'wishlist' : 'to-read')
    if (isEdit && !checked && !book.purchase_date) {
      setShowPurchasePrompt(true)
    }
  }

  function handleQuickPurchase(patch) {
    setShowPurchasePrompt(false)
    set('price', patch.price)
    set('purchase_date', patch.purchase_date)
  }

  const missingFields = getMissingFields(book)

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
        if (result.cover_url) clearPendingCover()
        setBook((b) => ({
          ...b,
          title: result.title || b.title,
          author: result.author?.length ? result.author : b.author,
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

  // Extrait de handleCoverUpload (le <input type="file">) pour être
  // réutilisable depuis le glisser-déposer, qui ne fournit pas le même
  // événement (dataTransfer.files, pas target.files).
  async function uploadCoverFile(file) {
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

    let compressed
    try {
      compressed = await compressImage(file)
    } catch {
      setCoverError(
        "Format d'image non pris en charge par le navigateur (HEIC ?). Essaie une photo JPEG ou PNG.",
      )
      setCoverUploading(false)
      return
    }

    clearPendingCover()
    const previewUrl = URL.createObjectURL(compressed)
    pendingCoverBlobRef.current = compressed
    pendingCoverPreviewUrlRef.current = previewUrl
    set('cover_url', previewUrl)
    setCoverUploading(false)
  }

  function handleRemoveCover() {
    clearPendingCover()
    set('cover_url', '')
  }

  function handleCoverUrlInput(value) {
    clearPendingCover()
    set('cover_url', value)
  }

  function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) uploadCoverFile(file)
  }

  function handleCoverDrop(e) {
    e.preventDefault()
    setCoverDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadCoverFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    // L'upload réel n'a lieu qu'ici, jamais avant : book.cover_url ne
    // contient qu'un aperçu local (blob:) tant qu'aucun fichier n'a été
    // choisi côté texte/ISBN. On résout la vraie URL avant de construire le
    // payload.
    let coverUrl = book.cover_url
    let uploadedNewCover = false
    if (pendingCoverBlobRef.current) {
      try {
        coverUrl = await uploadCover(pendingCoverBlobRef.current)
        uploadedNewCover = true
      } catch {
        setError("Échec de l'envoi de la couverture. Réessaie.")
        setSaving(false)
        return
      }
    }

    const payload = {
      ...pickEditable(book),
      cover_url: coverUrl,
      date_started: book.date_started || null,
      date_finished: book.date_finished || null,
      page_count: book.page_count === '' ? null : Number(book.page_count),
      rating: book.rating || null,
      price: book.price === '' ? null : Number(book.price),
      purchase_date: book.purchase_date || null,
      series: book.series?.trim() || null,
      series_index: book.series_index === '' ? null : Number(book.series_index),
      universe: book.universe?.trim() || null,
      edition: nullIfEmpty(book.edition),
      author: nullIfEmpty(book.author),
      translator: nullIfEmpty(book.translator),
      illustrator: nullIfEmpty(book.illustrator),
    }
    try {
      if (isEdit) {
        upsertBook(await updateBook(id, payload))
        const previousCoverUrl = originalCoverUrlRef.current
        if (previousCoverUrl && previousCoverUrl !== payload.cover_url) {
          deleteCover(previousCoverUrl)
        }
        clearPendingCover()
        // On revient en arrière (plutôt que naviguer vers la fiche) pour ne
        // pas empiler une entrée d'historique en plus de celle déjà créée
        // par le clic sur "Modifier" — sinon "Retour" depuis la fiche
        // atterrit sur ce formulaire fantôme au lieu de la collection.
        goBack()
      } else {
        upsertBook(await createBook(payload))
        clearPendingCover()
        navigate('/')
      }
    } catch (err) {
      // La cover vient d'être uploadée avec succès mais l'enregistrement du
      // livre a échoué : sans ce rollback, ce fichier tout juste envoyé
      // deviendrait orphelin immédiatement, exactement le problème que tout
      // ce chantier visait à éliminer.
      if (uploadedNewCover) deleteCover(coverUrl)
      setError(describeError(err))
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    setError(null)
    try {
      await deleteBook(id)
      removeBook(id)
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
          className={backLinkClass}
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
          id="book-form"
          onSubmit={handleSubmit}
          className={`${cardClass} p-6 space-y-5`}
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
                className={`flex-1 rounded-sm px-3 py-2 text-sm font-medium ${primaryButtonClass}`}
              >
                {lookupLoading ? 'Recherche…' : 'Chercher'}
              </button>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className={`flex-1 rounded-sm px-3 py-2 text-sm font-medium ${secondaryButtonClass}`}
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

          {/* Toujours visible (contrairement au statut complet, dans "Ma
              lecture" plus bas, repliée par défaut à l'ajout) : le cas
              d'usage visé est "en librairie, je veux juste noter que je le
              veux", sans avoir à déplier un menu pour ça. */}
          <WishlistCheckbox
            checked={book.status === 'wishlist'}
            onChange={handleWishlistToggle}
          />

          <FormSection title="Détails du livre" defaultOpen>
            <Field label="Auteur">
              <TagInput
                value={book.author ?? []}
                onChange={(v) => set('author', v)}
                suggestions={suggestions.authors}
                placeholder="Ajouter un auteur, Entrée pour valider"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Traducteur">
                <TagInput
                  value={book.translator ?? []}
                  onChange={(v) => set('translator', v)}
                  suggestions={suggestions.translators}
                  placeholder="Ajouter, Entrée pour valider"
                />
              </Field>
              <Field label="Dessinateur">
                <TagInput
                  value={book.illustrator ?? []}
                  onChange={(v) => set('illustrator', v)}
                  suggestions={suggestions.illustrators}
                  placeholder="Ajouter, Entrée pour valider"
                />
              </Field>
            </div>

            <Field label="Éditeur">
              <SuggestInput
                value={book.publisher}
                onChange={(v) => set('publisher', v)}
                suggestions={suggestions.publishers}
                className={inputClass}
              />
            </Field>

            <Field label="Collection">
              <SuggestInput
                value={book.collection}
                onChange={(v) => set('collection', v)}
                suggestions={suggestions.collections}
                placeholder="Folio SF, Champs…"
                className={inputClass}
              />
            </Field>

            {/* Pas de <Field> ici (qui enveloppe dans un <label>) : les
                boutons d'EditionCheckboxes sont eux-mêmes "labelable" —
                un <label> englobant aurait activé le premier d'entre eux
                (Poche) sur tout clic perdu dans la zone, même hors des
                boutons (même bug que celui déjà corrigé sur Couverture). */}
            <div className="block">
              <span className="block text-sm font-medium mb-1">Édition</span>
              <EditionCheckboxes
                value={book.edition ?? []}
                onChange={(v) => set('edition', v)}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label="Série">
                  <SuggestInput
                    value={book.series}
                    onChange={(v) => set('series', v)}
                    suggestions={suggestions.series}
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
              <SuggestInput
                value={book.universe}
                onChange={(v) => set('universe', v)}
                suggestions={suggestions.universes}
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

            {/* Pas de <Field> ici (qui enveloppe tout dans un <label>) :
                cette section contient déjà plusieurs contrôles labelables
                (vignette, URL, deux boutons d'import) — un <label>
                englobant les associe implicitement au premier d'entre eux
                dans l'ordre du DOM, donc cliquer n'importe où dans le champ
                activait le mauvais contrôle (bug réel rencontré avec
                l'input caché de la vignette, devenu le premier). */}
            <div className="block">
              <span className="block text-sm font-medium mb-1">Couverture</span>
              <div className="flex gap-4 items-start">
                {/* Glisser-déposer géré ici, sur le conteneur : les
                    événements drag remontent depuis le bouton enfant, donc
                    un seul jeu de handlers suffit pour les deux états
                    (avec/sans couverture). */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setCoverDragActive(true)
                  }}
                  onDragLeave={(e) => {
                    // dragleave se déclenche aussi en passant d'un enfant à
                    // un autre (l'icône, le texte) à l'intérieur de la
                    // zone, pas seulement en la quittant vraiment : sans ce
                    // garde-fou, l'état actif clignote pendant le survol et
                    // peut faire rater le dépôt. relatedTarget est
                    // l'élément vers lequel le pointeur se déplace — s'il
                    // est encore dans la zone, on n'en est pas vraiment
                    // sorti.
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setCoverDragActive(false)
                    }
                  }}
                  onDrop={handleCoverDrop}
                  className={`w-24 aspect-[2/3] shrink-0 rounded-sm border overflow-hidden flex items-center justify-center transition-colors ${
                    coverDragActive
                      ? 'border-library border-2 bg-library/5'
                      : book.cover_url
                        ? 'border-ink/10 bg-paper'
                        : 'border-dashed border-ink/25 bg-paper'
                  }`}
                >
                  {book.cover_url ? (
                    <button
                      type="button"
                      onClick={() => setCoverExpanded(true)}
                      aria-label="Agrandir la couverture"
                      className="w-full h-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                    >
                      <img
                        src={book.cover_url}
                        alt=""
                        className="w-full h-full object-contain cursor-zoom-in"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
                    >
                      {!coverDragActive && (
                        <svg
                          viewBox="0 0 20 20"
                          className="w-5 h-5 text-ink/40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M10 3v9m0-9-3 3m3-3 3 3" />
                          <path d="M4 13.5v1.5A1.5 1.5 0 0 0 5.5 16.5h9a1.5 1.5 0 0 0 1.5-1.5v-1.5" />
                        </svg>
                      )}
                      <span className="text-ink/60 text-[11px] text-center leading-tight">
                        {coverUploading
                          ? 'Import…'
                          : coverDragActive
                            ? 'Dépose ici'
                            : 'Cliquer ou glisser une image'}
                      </span>
                    </button>
                  )}
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept={COVER_ACCEPT}
                    className="sr-only"
                    onChange={handleCoverUpload}
                    disabled={coverUploading}
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="url"
                    value={book.cover_url ?? ''}
                    onChange={(e) => handleCoverUrlInput(e.target.value)}
                    placeholder="https://..."
                    className={inputClass}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-library hover:text-library focus-within:outline-none focus-within:ring-2 focus-within:ring-library">
                      {coverUploading ? 'Import…' : 'Importer une image'}
                      <input
                        type="file"
                        accept={COVER_ACCEPT}
                        className="sr-only"
                        onChange={handleCoverUpload}
                        disabled={coverUploading}
                      />
                    </label>
                    <label className="cursor-pointer rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-library hover:text-library focus-within:outline-none focus-within:ring-2 focus-within:ring-library">
                      {coverUploading ? 'Import…' : 'Prendre une photo'}
                      <input
                        type="file"
                        accept={COVER_ACCEPT}
                        capture="environment"
                        className="sr-only"
                        onChange={handleCoverUpload}
                        disabled={coverUploading}
                      />
                    </label>
                    {book.cover_url && (
                      <button
                        type="button"
                        onClick={handleRemoveCover}
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

            <Field label="Tags">
              <TagInput
                value={book.tags ?? []}
                onChange={(tags) => set('tags', tags)}
                suggestions={suggestions.tags}
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
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              {/* Une note n'a de sens qu'une fois le livre terminé. Pas de
                  <Field> (même raison que Couverture/Édition) : StarRating
                  rend 5 boutons, tous "labelable" — un <label> englobant
                  aurait activé le premier (1 étoile) sur un clic perdu
                  dans la zone. */}
              {book.status === 'read' && (
                <div className="block">
                  <span className="block text-sm font-medium mb-1">Note</span>
                  <StarRating
                    value={book.rating}
                    onChange={(v) => set('rating', v)}
                  />
                </div>
              )}
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

            {/* Pas encore acheté tant que c'est en wishlist : ces deux
                champs n'ont pas de sens avant. */}
            {book.status !== 'wishlist' && (
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
            )}
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
            <Field label="Citation favorite">
              <textarea
                rows={3}
                value={book.favorite_quote ?? ''}
                onChange={(e) => set('favorite_quote', e.target.value)}
                placeholder="Un passage qui vous a marqué…"
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
              className={`flex-1 rounded-sm py-2 text-sm ${primaryButtonClass}`}
            >
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>

            {isEdit && !confirmingDelete && (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className={`rounded-sm px-4 py-2 text-sm ${dangerOutlineButtonClass}`}
              >
                Supprimer
              </button>
            )}
          </div>

          {isEdit && confirmingDelete && (
            <InlineConfirm
              wrapped
              message="Supprimer définitivement ce livre ?"
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={handleDelete}
              disabled={saving}
            />
          )}
        </form>
      </div>

        <LivePreviewCard book={book} saving={saving} isEdit={isEdit} />
      </div>

      {/* Équivalent mobile du bouton flottant sous l'aperçu (desktop) :
          l'aperçu lui-même est caché en dessous de lg, donc pas de colonne
          sticky où l'accrocher. Même gabarit que le "+" flottant de
          Collection.jsx pour rester cohérent, mais calé sur le seuil lg
          (pas sm) puisque c'est celui qui régit l'aperçu sur cette page. */}
      <button
        type="submit"
        form="book-form"
        disabled={saving}
        aria-label={saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
        className="lg:hidden fixed bottom-6 right-6 flex items-center justify-center w-14 h-14 rounded-full bg-library-fill text-white shadow-lg hover:bg-library-fill/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
      >
        {saving ? (
          <span className="text-xs font-mono" aria-hidden="true">
            …
          </span>
        ) : (
          <span className="text-2xl leading-none" aria-hidden="true">
            ✓
          </span>
        )}
      </button>

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

      {showPurchasePrompt && (
        <QuickPurchaseModal
          bookTitle={book.title || 'ce livre'}
          bookAuthor={book.author?.length ? book.author.join(', ') : null}
          onConfirm={handleQuickPurchase}
          onSkip={() => setShowPurchasePrompt(false)}
        />
      )}

      {coverExpanded && (
        <CoverLightbox
          src={book.cover_url}
          alt={book.title}
          onClose={() => setCoverExpanded(false)}
        />
      )}
    </div>
  )
}
