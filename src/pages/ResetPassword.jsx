import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { primaryButtonClass, cardClass } from '../lib/ui'
import TextField from '../components/TextField'
import { validateNewPassword } from '../lib/passwordRules'
import LoadingScreen from '../components/LoadingScreen'

export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const passwordError = validateNewPassword(password, confirm)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)

    if (error) {
      setError('Impossible de mettre à jour le mot de passe. Réessaie.')
    } else {
      navigate('/', { replace: true })
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!session) {
    return (
      <div className="min-h-svh flex items-center justify-center p-6">
        <div className={`max-w-sm w-full ${cardClass} p-8 text-center`}>
          <h1 className="font-serif text-2xl font-semibold mb-3">
            Lien invalide ou expiré
          </h1>
          <p className="text-sm text-ink/70 mb-4">
            Redemande un email de réinitialisation depuis l'écran de
            connexion.
          </p>
          <Link
            to="/login"
            className="text-sm text-library underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <div className={`max-w-sm w-full ${cardClass} p-8`}>
        <p className="font-mono text-xs tracking-widest text-library uppercase mb-2 text-center">
          Nouveau mot de passe
        </p>
        <h1 className="font-serif text-3xl font-semibold mb-6 text-center">
          Ex Libris
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <TextField
            id="password"
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
          />
          <TextField
            id="confirm"
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={setConfirm}
          />

          {error && (
            <p role="alert" className="text-sm text-stamp">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full rounded-sm py-2 text-sm ${primaryButtonClass}`}
          >
            {submitting ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  )
}
