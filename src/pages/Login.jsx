import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { primaryButtonClass, cardClass } from '../lib/ui'
import TextField from '../components/TextField'
import { validateNewPassword } from '../lib/passwordRules'
import { describeSignInError, describeSignUpError, isClockSkewError } from '../lib/authErrors'
import { isPlainLeftClick, navigateWithViewTransition } from '../lib/navigation'

export default function Login() {
  const { session, signIn, signUp, signInWithGoogle, resetPasswordForEmail } =
    useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleBackToLanding(e) {
    if (!isPlainLeftClick(e)) return
    e.preventDefault()
    navigateWithViewTransition(navigate, '/', {
      direction: 'back',
      preload: () => import('./Home'),
    })
  }

  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)
  const [error, setError] = useState(null)
  const [clockSkew, setClockSkew] = useState(false)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (session) {
    const redirectTo = location.state?.from?.pathname || '/'
    return <Navigate to={redirectTo} replace />
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setError(null)
    setClockSkew(false)
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setClockSkew(isClockSkewError(error))
      setError(describeSignInError(error))
    }
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
    const passwordError = validateNewPassword(password, password2)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (!acceptedPolicy) {
      setError('Tu dois accepter la politique de confidentialité pour créer un compte.')
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
    // onAuthStateChange dans AuthProvider détecte la session et le <Navigate>
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
    setAcceptedPolicy(false)
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 gap-6">
      <Link
        to="/"
        onClick={handleBackToLanding}
        className="flex items-center gap-2 text-sm text-ink/70 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
      >
        <span aria-hidden="true">←</span> Retour à l'accueil
      </Link>
      <div className={`max-w-sm w-full ${cardClass} p-8`}>
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
            <TextField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
            />
            <TextField
              id="password"
              label="Mot de passe"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={setPassword}
            />

            {error && (
              <p role="alert" className="text-sm text-stamp">
                {error}
              </p>
            )}
            {clockSkew && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-sm border border-stamp/40 text-stamp py-2 text-sm hover:bg-stamp/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
              >
                Rafraîchir la page
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full rounded-sm py-2 text-sm ${primaryButtonClass}`}
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="flex items-center gap-3 text-xs text-ink/70">
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
            <p className="text-xs text-ink/70 text-center">
              En continuant, tu acceptes notre{' '}
              <Link
                to="/confidentialite"
                target="_blank"
                className="underline underline-offset-2 hover:text-ink/70"
              >
                politique de confidentialité
              </Link>
              .
            </p>

            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className="w-full text-center text-sm text-ink/70 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Mot de passe oublié ?
            </button>

            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="w-full text-center text-sm text-ink/70 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Créer un compte
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4" noValidate>
            <div className="flex gap-3">
              <TextField
                id="signup-first-name"
                label="Prénom"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={setFirstName}
                className="flex-1"
              />
              <TextField
                id="signup-last-name"
                label="Nom"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={setLastName}
                className="flex-1"
              />
            </div>
            <TextField
              id="signup-email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
            />
            <TextField
              id="signup-password"
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={setPassword}
            />
            <TextField
              id="signup-password2"
              label="Confirmer le mot de passe"
              type="password"
              autoComplete="new-password"
              required
              value={password2}
              onChange={setPassword2}
            />

            <label className="flex items-start gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
              />
              <span>
                J'accepte la{' '}
                <Link
                  to="/confidentialite"
                  target="_blank"
                  className="text-library underline underline-offset-2 hover:text-library/80"
                >
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>

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
              disabled={submitting || !acceptedPolicy}
              className={`w-full rounded-sm py-2 text-sm ${primaryButtonClass}`}
            >
              {submitting ? 'Création…' : 'Créer le compte'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full text-center text-sm text-ink/70 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
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
            <TextField
              id="forgot-email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
            />

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
              className={`w-full rounded-sm py-2 text-sm ${primaryButtonClass}`}
            >
              {submitting ? 'Envoi…' : 'Envoyer le lien'}
            </button>

            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full text-center text-sm text-ink/70 underline underline-offset-2 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
