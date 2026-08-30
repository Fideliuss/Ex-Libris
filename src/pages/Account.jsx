import { lazy, Suspense, useEffect, useRef, useState } from 'react'
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

// Indique de quel côté la rangée d'onglets déborde encore, pour afficher un
// dégradé de fondu uniquement là où il y a vraiment plus de contenu à
// atteindre (pas un dégradé permanent qui laisserait croire à du contenu
// caché même une fois arrivé au bout).
function useEdgeFade(ref) {
  const [fade, setFade] = useState({ left: false, right: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function update() {
      setFade({
        left: el.scrollLeft > 4,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
      })
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return fade
}

export default function Account() {
  const { user, signOut } = useAuth()
  const goBack = useGoBack('/')
  const navigate = useNavigate()
  const [tab, setTab] = useState('info')
  const navRef = useRef(null)
  const edgeFade = useEdgeFade(navRef)

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
            <div className="w-9 h-9 rounded-full bg-library-fill text-white font-mono text-sm flex items-center justify-center shrink-0">
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
          <div className="relative lg:contents">
            <nav
              ref={navRef}
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
                      ? 'bg-library-fill text-white'
                      : 'text-ink/70 hover:bg-card'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <div
              aria-hidden="true"
              className={`lg:hidden pointer-events-none absolute top-0 bottom-2 left-0 w-8 bg-gradient-to-r from-paper to-transparent transition-opacity ${edgeFade.left ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
              aria-hidden="true"
              className={`lg:hidden pointer-events-none absolute top-0 bottom-2 right-0 w-8 bg-gradient-to-l from-paper to-transparent transition-opacity ${edgeFade.right ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>

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
