import { lazy, Suspense } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoBack } from '../lib/navigation'
import SharingPanel from '../components/SharingPanel'
import LoadingScreen from '../components/LoadingScreen'
import ThemeToggle from '../components/ThemeToggle'
import DeleteAccountSection from '../components/DeleteAccountSection'

const ImportPanel = lazy(() => import('../components/ImportPanel'))
const ExportPanel = lazy(() => import('../components/ExportPanel'))

export default function Account() {
  const { user, signOut } = useAuth()
  const goBack = useGoBack('/')
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={goBack}
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à la collection
        </button>

        <div className="flex items-center gap-4 mt-6 mb-8">
          <div className="w-14 h-14 rounded-full bg-library text-white font-mono text-xl flex items-center justify-center shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="font-serif text-2xl font-semibold">Mon compte</h1>
            <p className="text-sm text-ink/60">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
              Partage
            </h2>
            <SharingPanel user={user} />
          </section>

          <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
              Bibliothèque
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Importer</h3>
                <Suspense fallback={<LoadingScreen fullScreen={false} />}>
                  <ImportPanel />
                </Suspense>
              </div>
              <div className="pt-4 border-t border-ink/10">
                <h3 className="text-sm font-medium mb-3">Exporter</h3>
                <Suspense fallback={<LoadingScreen fullScreen={false} />}>
                  <ExportPanel />
                </Suspense>
              </div>
            </div>
          </section>

          <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
              Apparence
            </h2>
            <ThemeToggle />
          </section>

          <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
              Sécurité
            </h2>
            <Link
              to="/reset-password"
              className="text-sm text-library underline underline-offset-2 hover:text-library/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Changer de mot de passe
            </Link>
            <DeleteAccountSection />
          </section>

          <section className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink/50 mb-4">
              Compte
            </h2>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-ink/60 underline underline-offset-2 hover:text-stamp focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
            >
              Se déconnecter
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
