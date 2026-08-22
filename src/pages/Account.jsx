import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useHouseholdBooks } from '../hooks/useHouseholdBooks'
import { useGoBack } from '../lib/navigation'

export default function Account() {
  const { user, signOut } = useAuth()
  const { partner } = useHouseholdBooks()
  const goBack = useGoBack('/')

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-md mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </button>

        <h1 className="font-serif text-2xl font-semibold mt-4 mb-6">
          Mon compte
        </h1>

        <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6 space-y-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-1">
              Email
            </p>
            <p className="text-sm">{user?.email}</p>
          </div>

          {partner && (
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-1">
                Foyer
              </p>
              <p className="text-sm">
                Partagé avec <span className="text-library">{partner.label}</span>
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-ink/10 space-y-3">
            <Link
              to="/reset-password"
              className="block text-sm text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Changer de mot de passe
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm text-ink/60 underline underline-offset-2 hover:text-stamp focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
