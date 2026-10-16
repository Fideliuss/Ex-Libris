import { useAppUpdate } from '../hooks/useAppUpdate'
import { APP_VERSION_LABEL, formatAppVersion } from '../lib/appVersion'
import { backLinkClass, primaryButtonClass } from '../lib/ui'
import Modal from './Modal'

// Avis affiché quand une nouvelle build de l'application est téléchargée :
// versions actuelle et nouvelle, puis rechargement à la demande.
export default function UpdatePrompt() {
  const { needRefresh, nextVersion, reload, dismiss } = useAppUpdate()
  if (!needRefresh) return null

  const nextLabel = nextVersion
    ? formatAppVersion(nextVersion.version, nextVersion.commit)
    : 'disponible'

  return (
    <Modal
      label="Nouvelle version disponible"
      onClose={dismiss}
      className="w-full max-w-sm bg-card border-t-4 border-dashed border-library rounded-sm shadow-xl p-7 text-center"
    >
      <p className="font-serif text-lg font-semibold mb-4">Nouvelle version disponible</p>
      <dl className="text-sm text-ink/70 space-y-1 mb-6">
        <div className="flex justify-between gap-4">
          <dt>Version actuelle</dt>
          <dd className="font-mono text-ink">{APP_VERSION_LABEL}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Nouvelle version</dt>
          <dd className="font-mono text-ink">{nextLabel}</dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={reload}
        className={`w-full rounded-sm px-4 py-2.5 text-sm ${primaryButtonClass}`}
      >
        Recharger
      </button>
      <button type="button" onClick={dismiss} className={`w-full ${backLinkClass} mt-3`}>
        Plus tard
      </button>
    </Modal>
  )
}
