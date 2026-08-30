import { lazy, Suspense, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoBack } from '../lib/navigation'
import SharingPanel from '../components/SharingPanel'
import LoadingScreen from '../components/LoadingScreen'
import ThemeToggle from '../components/ThemeToggle'
import DeleteAccountSection from '../components/DeleteAccountSection'
import PersonalInfoSection from '../components/PersonalInfoSection'

const ImportPanel = lazy(() => import('../components/ImportPanel'))
const ExportPanel = lazy(() => import('../components/ExportPanel'))

function LibrarySection() {
  return (
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
  )
}

function SecuritySection() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Mot de passe</h3>
        <Link
          to="/reset-password"
          className="inline-block rounded-sm border border-ink/20 px-4 py-2 text-sm text-ink/70 hover:border-library hover:text-library focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
        >
          Changer de mot de passe
        </Link>
      </div>
      <DeleteAccountSection />
    </div>
  )
}

export default function Account() {
  const { user, signOut } = useAuth()
  const goBack = useGoBack('/')
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')

  async function handleSignOut() {
    await signOut()
    navigate('/', { replace: true })
  }

  const tabs = [
    { key: 'info', label: 'Informations personnelles', content: <PersonalInfoSection user={user} /> },
    { key: 'partage', label: 'Partage', content: <SharingPanel user={user} /> },
    { key: 'bibliotheque', label: 'Bibliothèque', content: <LibrarySection /> },
    { key: 'apparence', label: 'Apparence', content: <ThemeToggle /> },
    { key: 'securite', label: 'Sécurité', content: <SecuritySection /> },
  ]
  const activeTab = tabs.find((t) => t.key === tab) ?? tabs[0]

  return (
    <div className="min-h-svh p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-ink/70 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
          >
            ← Retour à la collection
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-library text-white font-mono text-sm flex items-center justify-center shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-sm border border-ink/20 px-3 py-1.5 text-sm text-ink/70 hover:border-stamp hover:text-stamp focus:outline-none focus-visible:ring-2 focus-visible:ring-library"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <h1 className="font-serif text-2xl font-semibold mb-6">Mon compte</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          <nav
            role="tablist"
            aria-label="Sections du compte"
            className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:w-56 shrink-0"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 text-left rounded-sm px-3 py-2 text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
                  tab === t.key
                    ? 'bg-library text-white'
                    : 'text-ink/70 hover:bg-card'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div
            role="tabpanel"
            className="flex-1 min-w-0 bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6"
          >
            {activeTab.content}
          </div>
        </div>
      </div>
    </div>
  )
}
