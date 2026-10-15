import { useEffect, useRef, useState } from 'react'
import { compressImage } from '../lib/storage'

const MAX_FILE_SIZE = 5 * 1024 * 1024

// Gestion de la couverture choisie dans le formulaire livre.
//
// L'upload réel vers le storage n'a lieu qu'à la sauvegarde, pas au choix du
// fichier : sinon quitter la page sans enregistrer laisse un fichier orphelin
// en storage (bug réel rencontré). En attendant, on affiche un aperçu 100 %
// local (URL.createObjectURL, aucun réseau) et on garde le blob compressé de
// côté (getPendingBlob) pour l'upload différé.
//
// `onChange(url)` reçoit l'URL à afficher : un aperçu local (blob:), l'URL
// saisie, ou '' quand la couverture est retirée.
export function useCoverUpload(onChange) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const pendingBlobRef = useRef(null)
  const previewUrlRef = useRef(null)

  function clearPendingCover() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    pendingBlobRef.current = null
  }

  // Révoque l'aperçu local en attente si la page est quittée sans avoir
  // soumis le formulaire (fermeture d'onglet ou navigation SPA) : pas
  // d'impact storage (rien n'a été uploadé), juste l'hygiène mémoire du blob.
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  // Commun au sélecteur de fichier et au glisser-déposer, qui ne fournissent
  // pas le même événement (target.files, dataTransfer.files).
  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Image trop lourde (5 Mo maximum).')
      return
    }

    setUploading(true)
    setError(null)

    let compressed
    try {
      compressed = await compressImage(file)
    } catch {
      setError(
        "Format d'image non pris en charge par le navigateur (HEIC ?). Essaie une photo JPEG ou PNG.",
      )
      setUploading(false)
      return
    }

    clearPendingCover()
    const previewUrl = URL.createObjectURL(compressed)
    pendingBlobRef.current = compressed
    previewUrlRef.current = previewUrl
    onChange(previewUrl)
    setUploading(false)
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) handleFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function removeCover() {
    clearPendingCover()
    onChange('')
  }

  // URL saisie à la main : remplace tout fichier en attente.
  function setUrl(value) {
    clearPendingCover()
    onChange(value)
  }

  return {
    uploading,
    error,
    dragActive,
    setDragActive,
    getPendingBlob: () => pendingBlobRef.current,
    clearPendingCover,
    handleInputChange,
    handleDrop,
    removeCover,
    setUrl,
  }
}
