import { useEffect, useState } from 'react'
import { getMyProfile } from '../lib/friendCode'
import {
  getMyHousehold,
  inviteToHousehold,
  acceptHouseholdInvite,
  declineHouseholdInvite,
  cancelHouseholdInvite,
  leaveHousehold,
  removeHouseholdMember,
  renameHousehold,
} from '../lib/household'
import { describeError } from '../lib/errors'
import { inputClass, labelClass, secondaryButtonClass } from '../lib/ui'
import LoadingScreen from './LoadingScreen'

function initials(label) {
  return (label ?? '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function SharingPanel({ user }) {
  const [profile, setProfile] = useState(undefined) // undefined = chargement, null = compte sans profil
  const [household, setHousehold] = useState(undefined)
  const [tab, setTab] = useState('membres')
  const [codeInput, setCodeInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function loadAll() {
    const [p, h] = await Promise.all([getMyProfile(user.id), getMyHousehold(user.id)])
    setProfile(p)
    setHousehold(h)
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

  function handleInvite(e) {
    e.preventDefault()
    runAction(async () => {
      await inviteToHousehold(codeInput)
      setCodeInput('')
    })
  }

  function handleRename(e) {
    e.preventDefault()
    runAction(async () => {
      await renameHousehold(nameInput)
      setRenaming(false)
    })
  }

  function handleLeave() {
    setConfirmingLeave(false)
    runAction(leaveHousehold)
  }

  function handleRemove(memberId) {
    setConfirmingRemove(null)
    runAction(() => removeHouseholdMember(memberId))
  }

  if (profile === undefined || household === undefined) {
    return <LoadingScreen fullScreen={false} />
  }

  const invitesCount = household.invites.length + household.incomingInvites.length

  return (
    <div>
      {error && (
        <p role="alert" className="text-sm text-stamp mb-3">
          {error}
        </p>
      )}

      {!profile ? (
        <p className="text-sm text-ink/70">Aucun profil trouvé pour ce compte.</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className={`${labelClass} mb-2`}>Ex Bibliotheca</p>

              {household.members.length > 0 && (
                <div className="flex -space-x-2 mb-2">
                  {household.members.map((m) => (
                    <div
                      key={m.userId}
                      title={m.displayName ?? m.email}
                      className="w-9 h-9 rounded-full bg-library-fill text-white flex items-center justify-center text-xs font-serif font-semibold border-2 border-card"
                    >
                      {initials(m.displayName ?? m.email)}
                    </div>
                  ))}
                </div>
              )}

              {renaming ? (
                <form onSubmit={handleRename} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nom du foyer"
                    className={`${inputClass} w-48`}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={working}
                    className={`rounded-sm px-2 py-1 text-xs ${secondaryButtonClass}`}
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setRenaming(false)}
                    className="text-xs text-ink/70 underline underline-offset-2"
                  >
                    Annuler
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-semibold text-lg text-ink">
                    {household.name ?? (household.id ? 'Foyer sans nom' : 'Pas encore de foyer')}
                  </h3>
                  {household.isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(household.name ?? '')
                        setRenaming(true)
                      }}
                      className="text-xs text-ink/50 hover:text-library underline underline-offset-2"
                    >
                      Renommer
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <p className={`${labelClass} mb-1`}>Ton code ami</p>
              <span className="font-mono text-lg tracking-widest text-library">{profile.friend_code}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="block ml-auto text-xs text-ink/70 hover:text-library underline underline-offset-2"
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          <div className="flex gap-4 border-b border-ink/20 mb-4">
            <button
              type="button"
              onClick={() => setTab('membres')}
              className={`text-sm pb-2 border-b-2 -mb-px ${
                tab === 'membres' ? 'border-library text-library font-medium' : 'border-transparent text-ink/70'
              }`}
            >
              Membres
            </button>
            <button
              type="button"
              onClick={() => setTab('invitations')}
              className={`flex items-center gap-1.5 text-sm pb-2 border-b-2 -mb-px ${
                tab === 'invitations' ? 'border-library text-library font-medium' : 'border-transparent text-ink/70'
              }`}
            >
              Invitations
              {invitesCount > 0 && (
                <span className="bg-stamp-fill text-white rounded-full text-[10px] leading-none px-1.5 py-0.5">
                  {invitesCount}
                </span>
              )}
            </button>
          </div>

          {tab === 'membres' ? (
            <div>
              <div className="divide-y divide-ink/10">
                {household.members.length === 0 ? (
                  <p className="text-sm text-ink/70 py-1">Tu es seul(e) pour l'instant.</p>
                ) : (
                  household.members.map((m) => (
                    <div key={m.userId} className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 rounded-full bg-library-fill text-white flex items-center justify-center text-xs font-serif font-semibold shrink-0">
                        {initials(m.displayName ?? m.email)}
                      </div>
                      <span className="text-sm text-ink flex-1">
                        {m.displayName ?? m.email}
                        {m.userId === user.id && ' (toi)'}
                      </span>
                      {m.isOwner ? (
                        <span className={labelClass}>Fondateur</span>
                      ) : (
                        household.isOwner &&
                        (confirmingRemove === m.userId ? (
                          <span className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRemove(m.userId)}
                              disabled={working}
                              className="text-xs text-stamp underline underline-offset-2 disabled:opacity-50"
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingRemove(null)}
                              className="text-xs text-ink/70 underline underline-offset-2"
                            >
                              Annuler
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingRemove(m.userId)}
                            className="text-xs text-ink/50 hover:text-stamp shrink-0"
                          >
                            Retirer
                          </button>
                        ))
                      )}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleInvite} className="flex items-end gap-2 mt-4">
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
                  Inviter
                </button>
              </form>

              {household.id &&
                (confirmingLeave ? (
                  <div className="flex items-center gap-3 mt-4">
                    <p className="text-sm text-stamp">Quitter le foyer ?</p>
                    <button
                      type="button"
                      onClick={handleLeave}
                      disabled={working}
                      className="text-xs text-stamp underline underline-offset-2 disabled:opacity-50"
                    >
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingLeave(false)}
                      className="text-xs text-ink/70 underline underline-offset-2"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingLeave(true)}
                    className="text-xs text-ink/50 hover:text-stamp underline underline-offset-2 mt-4"
                  >
                    Quitter le foyer
                  </button>
                ))}
            </div>
          ) : (
            <div className="space-y-3">
              {invitesCount === 0 && <p className="text-sm text-ink/70">Aucune invitation en attente.</p>}

              {household.incomingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink/70">{inv.invitedByLabel} t'invite à rejoindre son foyer.</p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => runAction(() => acceptHouseholdInvite(inv.id))}
                      disabled={working}
                      className="text-xs text-library underline underline-offset-2 disabled:opacity-50"
                    >
                      Accepter
                    </button>
                    <button
                      type="button"
                      onClick={() => runAction(() => declineHouseholdInvite(inv.id))}
                      disabled={working}
                      className="text-xs text-ink/70 hover:text-stamp underline underline-offset-2 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ))}

              {household.invites.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-ink/70">
                    {inv.inviteeLabel}
                    {inv.invitedBy !== user.id && <> (invité par {inv.invitedByLabel})</>}, en attente de réponse.
                  </p>
                  {inv.invitedBy === user.id && (
                    <button
                      type="button"
                      onClick={() => runAction(() => cancelHouseholdInvite(inv.id))}
                      disabled={working}
                      className="shrink-0 text-xs text-ink/70 hover:text-stamp underline underline-offset-2 disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
