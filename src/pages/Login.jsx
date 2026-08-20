import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { inputClass } from '../lib/ui'

export default function Login() {
  const { session, signIn, resetPasswordForEmail } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('signin') // 'signin' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const redirectTo = location.state?.from?.pathname || '/'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setError(describeSignInError(error))
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    const { error } = await resetPasswordForEmail(email)
    setSubmitting(false)
    if (error) {
      setError("Impossible d'envoyer l'email. Vérifie l'adresse saisie.")
    } else {
      setInfo(
        'Email envoyé si un compte existe avec cette adresse. Vérifie ta boîte de réception.',
      )
    }
  }

  function switchMode(next) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-8">
        <p className="font-mono text-xs tracking-widest text-library uppercase mb-2 text-center">
          {mode === 'signin' ? 'Connexion' : 'Mot de passe oublié'}
        </p>
        <h1 className="font-serif text-3xl font-semibold mb-6 text-center">
          Ma Bibliothèque
        </h1>

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-stamp">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-library text-white font-medium py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="w-full text-center text-sm text-ink/60 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Mot de passe oublié ?
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="space-y-4" noValidate>
            <p className="text-sm text-ink/70">
              Indique ton email, tu recevras un lien pour réinitialiser ton
              mot de passe.
            </p>
            <div>
              <label
                htmlFor="forgot-email"
                className="block text-sm font-medium mb-1"
              >
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-stamp">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-sm text-library">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-sm bg-library text-white font-medium py-2 text-sm hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library disabled:opacity-60"
            >
              {submitting ? 'Envoi…' : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full text-center text-sm text-ink/60 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function describeSignInError(error) {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (code === 'email_not_confirmed' || /email.*not.*confirm/i.test(message)) {
    return "Ce compte n'est pas confirmé. Dans Supabase, va sur Authentication → Users, ouvre le compte et confirme l'email (ou recrée-le avec « Auto Confirm User » coché)."
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'Email ou mot de passe incorrect.'
  }
  return `Connexion impossible : ${message || 'erreur inconnue'}.`
}
