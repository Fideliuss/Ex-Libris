import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { deleteMyAccount } from '../lib/account'
import { describeError } from '../lib/errors'

export default function DeleteAccountSection() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    setWorking(true)
    setError(null)
    try {
      await deleteMyAccount(user.id)
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      setError(describeError(err))
      setWorking(false)
      setConfirming(false)
    }
  }

  return (
    <div className="pt-4 border-t border-ink/10">
      <h3 className="text-sm font-medium text-stamp mb-2">Zone dangereuse</h3>
      <p className="text-sm text-ink/70 mb-3">
        Supprime définitivement ton compte et toutes tes données (livres,
        partage, couvertures). Cette action est irréversible.
      </p>

      {error && (
        <p role="alert" className="text-sm text-stamp mb-3">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="flex items-center gap-3">
          <p className="text-sm text-stamp">
            Confirmer la suppression définitive ?
          </p>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={working}
            className="text-xs text-ink/70 underline underline-offset-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={working}
            className="rounded-sm bg-stamp-fill text-white font-medium px-3 py-1.5 text-xs hover:bg-stamp-fill/90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp"
          >
            {working ? 'Suppression…' : 'Oui, tout supprimer'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-sm border border-stamp text-stamp font-medium px-3 py-1.5 text-sm hover:bg-stamp-fill hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stamp"
        >
          Supprimer mon compte
        </button>
      )}
    </div>
  )
}
