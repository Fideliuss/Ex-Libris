import { useEffect, useRef, useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { updateMyProfile } from '../lib/profile'
import { describeError } from '../lib/errors'
import { inputClass, labelClass, secondaryButtonClass } from '../lib/ui'
import LoadingScreen from './LoadingScreen'

export default function PersonalInfoSection({ user }) {
  const { profile, refreshProfile } = useProfile()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  // Les champs ne sont préremplis qu'une fois : un rechargement du profil
  // après l'enregistrement ne doit pas écraser ce que l'utilisateur tape.
  const filled = useRef(false)

  useEffect(() => {
    if (profile === undefined || filled.current) return
    filled.current = true
    setFirstName(profile?.first_name ?? '')
    setLastName(profile?.last_name ?? '')
  }, [profile])

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
      await refreshProfile()
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
        <label htmlFor="firstName" className={`block ${labelClass} mb-1`}>
          Prénom
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="lastName" className={`block ${labelClass} mb-1`}>
          Nom
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className={`block ${labelClass} mb-1`}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={user.email ?? ''}
          disabled
          className="w-full rounded-sm border border-ink/10 bg-paper px-3 py-2 text-sm text-ink/70 cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className={`rounded-sm px-4 py-2 text-sm ${secondaryButtonClass}`}
      >
        {saving ? 'Enregistrement…' : saved ? 'Enregistré ✓' : 'Enregistrer'}
      </button>
    </form>
  )
}
