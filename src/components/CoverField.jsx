import { useRef } from 'react'
import { inputClass } from '../lib/ui'

// Exclut explicitement HEIC/HEIF (photos par défaut sur iPhone) : le canvas
// de compressImage ne sait pas les décoder sur Chrome/Firefox. C'est un
// indice pour le sélecteur de fichier du système, pas une garantie : le
// glisser-déposer l'ignore et compressImage reste la vraie barrière.
const COVER_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/bmp'

// Champ Couverture du formulaire livre : vignette cliquable (agrandir) ou
// zone de dépôt, URL libre, import et prise de photo. `cover` est le retour de
// useCoverUpload.
//
// Pas de <Field> ici (qui enveloppe tout dans un <label>) : cette section
// contient déjà plusieurs contrôles labelables (vignette, URL, deux boutons
// d'import). Un <label> englobant les associe implicitement au premier
// d'entre eux dans l'ordre du DOM, donc cliquer n'importe où dans le champ
// activait le mauvais contrôle (bug réel rencontré avec l'input caché de la
// vignette, devenu le premier).
export default function CoverField({ coverUrl, cover, onExpand }) {
  const coverFileInputRef = useRef(null)

  return (
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
            cover.setDragActive(true)
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
              cover.setDragActive(false)
            }
          }}
          onDrop={cover.handleDrop}
          className={`w-24 aspect-[2/3] shrink-0 rounded-sm border overflow-hidden flex items-center justify-center transition-colors ${
            cover.dragActive
              ? 'border-library border-2 bg-library/5'
              : coverUrl
                ? 'border-ink/10 bg-paper'
                : 'border-dashed border-ink/25 bg-paper'
          }`}
        >
          {coverUrl ? (
            <button
              type="button"
              onClick={onExpand}
              aria-label="Agrandir la couverture"
              className="w-full h-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              <img
                src={coverUrl}
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
              {!cover.dragActive && (
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
                {cover.uploading
                  ? 'Import…'
                  : cover.dragActive
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
            onChange={cover.handleInputChange}
            disabled={cover.uploading}
          />
        </div>

        <div className="flex-1 space-y-2">
          <input
            type="url"
            value={coverUrl ?? ''}
            onChange={(e) => cover.setUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-library hover:text-library focus-within:outline-none focus-within:ring-2 focus-within:ring-library">
              {cover.uploading ? 'Import…' : 'Importer une image'}
              <input
                type="file"
                accept={COVER_ACCEPT}
                className="sr-only"
                onChange={cover.handleInputChange}
                disabled={cover.uploading}
              />
            </label>
            <label className="cursor-pointer rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-library hover:text-library focus-within:outline-none focus-within:ring-2 focus-within:ring-library">
              {cover.uploading ? 'Import…' : 'Prendre une photo'}
              <input
                type="file"
                accept={COVER_ACCEPT}
                capture="environment"
                className="sr-only"
                onChange={cover.handleInputChange}
                disabled={cover.uploading}
              />
            </label>
            {coverUrl && (
              <button
                type="button"
                onClick={cover.removeCover}
                className="text-sm text-ink/70 hover:text-stamp underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
              >
                Retirer
              </button>
            )}
          </div>
          {cover.error && (
            <p role="alert" className="text-sm text-stamp">
              {cover.error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
