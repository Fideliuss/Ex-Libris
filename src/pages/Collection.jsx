import { useAuth } from '../context/AuthContext'

export default function Collection() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-svh p-6">
      <header className="flex items-start justify-between max-w-3xl mx-auto mb-8 gap-4">
        <div>
          <p className="font-mono text-xs tracking-widest text-library uppercase mb-1">
            Étape 2 / 10
          </p>
          <h1 className="font-serif text-2xl font-semibold">
            Ma Bibliothèque
          </h1>
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="shrink-0 rounded-sm border border-ink/20 px-3 py-2 text-sm text-ink/70 hover:text-stamp hover:border-stamp focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        >
          Se déconnecter
        </button>
      </header>

      <div className="max-w-3xl mx-auto bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-8 text-center">
        <p className="text-sm text-ink/70">
          Connecté en tant que{' '}
          <span className="font-mono text-ink">{user?.email}</span>
        </p>
        <p className="text-sm text-ink/70 mt-2">
          La collection de livres arrivera à l'étape 4.
        </p>
      </div>
    </div>
  )
}
