import { useEffect, useState } from 'react'
import { getMyProfile, updateMyProfile } from '../lib/friendCode'
import { describeError } from '../lib/errors'
import LoadingScreen from './LoadingScreen'

export default function PersonalInfoSection({ user }) {
  const [profile, setProfile] = useState(undefined) // undefined = chargement
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMyProfile(user.id)
      .then((p) => {
        setProfile(p)
        setFirstName(p?.first_name ?? '')
        setLastName(p?.last_name ?? '')
      })
      .catch((err) => setError(describeError(err)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!firstName.trim()) {
      setError('Le prénom est obligatoire.')
      return
    }
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await updateMyProfile(user.id, { firstName, lastName })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(describeError(err))
    } finally {
      setSaving(false)
    }
  }

  if (profile === undefined) {
    return <LoadingScreen fullScreen={false} />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {error && (
        <p role="alert" className="text-sm text-stamp">
          {error}
        </p>
      )}

      <div>
        <label
          htmlFor="firstName"
          className="block font-mono text-xs uppercase tracking-widest text-ink/50 mb-1"
        >
          Prénom
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        />
      </div>

      <div>
        <label
          htmlFor="lastName"
          className="block font-mono text-xs uppercase tracking-widest text-ink/50 mb-1"
        >
          Nom
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded-sm border border-ink/20 bg-surface px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block font-mono text-xs uppercase tracking-widest text-ink/50 mb-1"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={user.email ?? ''}
          disabled
          className="w-full rounded-sm border border-ink/10 bg-paper px-3 py-2 text-sm text-ink/50 cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-sm border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:border-library hover:text-library disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
      >
        {saving ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
      </button>
    </form>
  )
}
