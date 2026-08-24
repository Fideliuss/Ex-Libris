import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { inputClass } from '../lib/ui'
import { navigateWithViewTransition } from '../lib/navigation'

export default function Login() {
  const { session, signIn, signUp, signInWithGoogle, resetPasswordForEmail } =
    useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleBackToLanding(e) {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigateWithViewTransition(navigate, '/', { direction: 'back' })
  }

  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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

  async function handleGoogleSignIn() {
    setError(null)
    setSubmitting(true)
    const { error } = await signInWithGoogle()
    // En cas de succès, Supabase redirige la page entière vers Google : ce
    // composant est démonté avant même que setSubmitting(false) ne compte.
    setSubmitting(false)
    if (error) {
      setError(`Connexion Google impossible : ${error.message || 'erreur inconnue'}.`)
    }
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setSubmitting(true)
    const { data, error } = await signUp(email, password, { firstName, lastName })
    setSubmitting(false)
    if (error) {
      setError(describeSignUpError(error))
    } else if (!data.session) {
      setInfo(
        'Compte créé. Vérifie ta boîte de réception pour confirmer ton email avant de te connecter.',
      )
    }
    // Si data.session existe, Supabase a déjà confirmé le compte : l'écoute
    // onAuthStateChange dans AuthContext détecte la session et le <Navigate>
    // plus haut redirige automatiquement.
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
    setPassword('')
    setPassword2('')
    setFirstName('')
    setLastName('')
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 gap-6">
      <Link
        to="/"
        onClick={handleBackToLanding}
        className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
      >
        <span aria-hidden="true">←</span> Retour à l'accueil
      </Link>
      <div className="max-w-sm w-full bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-8">
        <p className="font-mono text-xs tracking-widest text-library uppercase mb-2 text-center">
          {mode === 'signin' && 'Connexion'}
          {mode === 'signup' && 'Créer un compte'}
          {mode === 'forgot' && 'Mot de passe oublié'}
        </p>
        <h1 className="font-serif text-3xl font-semibold mb-6 text-center">
          Ex Libris
        </h1>

        {mode === 'signin' && (
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

            <div className="flex items-center gap-3 text-xs text-ink/40">
              <div className="flex-1 border-t border-ink/10" />
              ou
              <div className="flex-1 border-t border-ink/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full rounded-sm border border-ink/20 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library disabled:opacity-60"
            >
              Continuer avec Google
            </button>

            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="w-full text-center text-sm text-ink/60 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Mot de passe oublié ?
            </button>

            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="w-full text-center text-sm text-ink/60 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Créer un compte
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4" noValidate>
            <div className="flex gap-3">
              <div className="flex-1">
                <label
                  htmlFor="signup-first-name"
                  className="block text-sm font-medium mb-1"
                >
                  Prénom
                </label>
                <input
                  id="signup-first-name"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="signup-last-name"
                  className="block text-sm font-medium mb-1"
                >
                  Nom
                </label>
                <input
                  id="signup-last-name"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium mb-1"
              >
                Email
              </label>
              <input
                id="signup-email"
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
                htmlFor="signup-password"
                className="block text-sm font-medium mb-1"
              >
                Mot de passe
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="signup-password2"
                className="block text-sm font-medium mb-1"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="signup-password2"
                type="password"
                autoComplete="new-password"
                required
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
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
              {submitting ? 'Création…' : 'Créer le compte'}
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

        {mode === 'forgot' && (
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

function describeSignUpError(error) {
  const code = error.code ?? ''
  const message = error.message ?? ''

  if (
    code === 'user_already_exists' ||
    /already registered|already exists/i.test(message)
  ) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (code === 'weak_password' || /password/i.test(message)) {
    return 'Mot de passe trop faible : essaie au moins 6 caractères.'
  }
  return `Impossible de créer le compte : ${message || 'erreur inconnue'}.`
}
