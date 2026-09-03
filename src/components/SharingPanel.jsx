import { useEffect, useState } from 'react'
import { acceptLink, getMyLinks, getMyProfile, removeLink, sendFriendRequest } from '../lib/friendCode'
import { describeError } from '../lib/errors'
import { inputClass, labelClass, secondaryButtonClass } from '../lib/ui'
import LoadingScreen from './LoadingScreen'

export default function SharingPanel({ user }) {
  const [profile, setProfile] = useState(undefined) // undefined = chargement, null = compte sans profil (créé avant le trigger d'inscription)
  const [links, setLinks] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmingStop, setConfirmingStop] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function loadAll() {
    const [p, l] = await Promise.all([getMyProfile(user.id), getMyLinks(user.id)])
    setProfile(p)
    setLinks(l)
  }

  useEffect(() => {
    loadAll().catch((err) => setError(describeError(err)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  async function runAction(fn) {
    setWorking(true)
    setError(null)
    try {
      await fn()
      await loadAll()
    } catch (err) {
      setError(describeError(err))
    } finally {
      setWorking(false)
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(profile.friend_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSendRequest(e) {
    e.preventDefault()
    runAction(() => sendFriendRequest(codeInput, user.id))
  }

  function handleStopSharing() {
    setConfirmingStop(false)
    runAction(() => removeLink(links.accepted.id))
  }

  if (profile === undefined || links === null) {
    return <LoadingScreen fullScreen={false} />
  }

  return (
    <div>
      {error && (
        <p role="alert" className="text-sm text-stamp mb-3">
          {error}
        </p>
      )}

      {!profile ? (
        <p className="text-sm text-ink/70">
          Aucun profil trouvé pour ce compte.
        </p>
      ) : (
        <>
          <div className="mb-4">
            <p className={`${labelClass} mb-1`}>Ton code ami</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg tracking-widest text-library">
                {profile.friend_code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs text-ink/70 hover:text-library underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          {links.accepted ? (
            <div>
              <p className="text-sm mb-2">
                Partagé avec{' '}
                <span className="text-library">
                  {links.accepted.other?.display_name ?? 'un compte lié'}
                </span>
              </p>
              {confirmingStop ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-stamp">Arrêter le partage ?</p>
                  <button
                    type="button"
                    onClick={() => setConfirmingStop(false)}
                    className="text-xs text-ink/70 underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleStopSharing}
                    disabled={working}
                    className="text-xs text-stamp underline underline-offset-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    Confirmer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingStop(true)}
                  className="text-xs text-ink/70 hover:text-stamp underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                >
                  Arrêter le partage
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {links.outgoingPending && (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink/70">
                    Demande envoyée à{' '}
                    {links.outgoingPending.other?.display_name ??
                      links.outgoingPending.other?.email}
                    , en attente de réponse.
                  </p>
                  <button
                    type="button"
                    onClick={() => runAction(() => removeLink(links.outgoingPending.id))}
                    disabled={working}
                    className="shrink-0 text-xs text-ink/70 hover:text-stamp underline underline-offset-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                  >
                    Annuler
                  </button>
                </div>
              )}

              {links.incomingPending.map((link) => (
                <div key={link.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink/70">
                    {link.other?.display_name ?? link.other?.email} veut partager sa
                    bibliothèque avec toi.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => runAction(() => acceptLink(link.id))}
                      disabled={working}
                      className="text-xs text-library underline underline-offset-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(() => removeLink(link.id))}
                      disabled={working}
                      className="text-xs text-ink/70 hover:text-stamp underline underline-offset-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}

              {!links.outgoingPending && (
                <form onSubmit={handleSendRequest} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={`block ${labelClass} mb-1`}>Code d'un ami</label>
                    <input
                      type="text"
                      value={codeInput}
                      onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="ABC123"
                      className={`${inputClass} uppercase`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={working || !codeInput.trim()}
                    className={`rounded-sm px-3 py-2 text-sm ${secondaryButtonClass}`}
                  >
                    Envoyer
                  </button>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
