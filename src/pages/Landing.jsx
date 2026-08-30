import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { navigateWithViewTransition } from '../lib/navigation'
import BookCoverPlaceholder from '../components/BookCoverPlaceholder'

const LANG_STORAGE_KEY = 'landing-lang'

const STRINGS = {
  fr: {
    nav: { features: 'Fonctionnalités', pricing: 'Tarifs', login: 'Se connecter' },
    hero: {
      eyebrow: 'Ta bibliothèque personnelle',
      titleLine1: 'La bibliothèque qui porte',
      titleLine2: 'ton nom.',
      subtitle:
        'Scanne, classe, suis tes objectifs de lecture et partage le tout avec ton foyer.',
      cta: 'Se connecter',
    },
    featuresTitle: 'Fonctionnalités',
    features: [
      {
        title: 'Ajoute en un scan',
        text: 'Scanne le code-barres ISBN et la fiche se remplit toute seule (Google Books, OpenLibrary, BNF en secours).',
      },
      {
        title: 'Toute ta collection, triée',
        text: 'Livres, BD, comics, mangas : statut, tags, séries, éditeurs et collections, tout au même endroit.',
      },
      {
        title: 'Objectifs & statistiques',
        text: "Un objectif de lecture par an, un système de points, un calendrier de lecture et l'historique des années passées.",
      },
      {
        title: 'À deux, en toute simplicité',
        text: 'Partage ta bibliothèque avec ton foyer : chacun garde ses livres, mais vous voyez tout à deux.',
      },
    ],
    howTitle: 'Comment ça marche',
    steps: [
      {
        title: 'Scanne ou cherche',
        text: 'Ajoute un livre en scannant son ISBN ou en le cherchant à la main.',
      },
      {
        title: 'Suis ta progression',
        text: 'Statut de lecture, notes, objectif annuel : ta collection évolue avec toi.',
      },
      {
        title: 'Partage',
        text: 'Invite ton foyer pour voir sa collection à côté de la tienne.',
      },
    ],
    pricingTitle: 'Tarifs',
    pricingNote: "Aperçu — l'application n'est pas encore ouverte au public.",
    pricing: [
      {
        name: 'Basic',
        price: 'Gratuit',
        tagline: 'Pour découvrir ta bibliothèque perso.',
        items: ['Collection limitée', 'Scan ISBN', 'Statuts de base'],
      },
      {
        name: 'Premium',
        price: 'Bientôt',
        tagline: 'Pour les lecteurs assidus.',
        items: ['Collection illimitée', 'Statistiques & objectifs', 'Historique complet'],
      },
      {
        name: 'Duo',
        price: 'Bientôt',
        tagline: 'Pour partager à deux.',
        items: ['Tout Premium', 'Partage à deux', "Activité de l'autre"],
        highlighted: true,
        badge: 'Recommandé',
      },
      {
        name: 'Family',
        price: 'Bientôt',
        tagline: 'Pour toute la famille.',
        items: ['Tout Duo', 'Comptes multiples', 'Gestion des permissions'],
      },
    ],
    finalCtaTitle: 'Prêt·e à ranger ta bibliothèque ?',
    footer: 'Ex Libris',
    legalNotice: 'Mentions légales',
    privacyPolicy: 'Confidentialité',
  },
  en: {
    nav: { features: 'Features', pricing: 'Pricing', login: 'Log in' },
    hero: {
      eyebrow: 'Your personal library',
      titleLine1: 'The library that bears',
      titleLine2: 'your name.',
      subtitle:
        'Scan, sort, track your reading goals and share it all with your household.',
      cta: 'Log in',
    },
    featuresTitle: 'Features',
    features: [
      {
        title: 'Add with a scan',
        text: 'Scan the ISBN barcode and the entry fills itself in (Google Books, OpenLibrary, BNF as fallback).',
      },
      {
        title: 'Your whole collection, sorted',
        text: 'Books, comics, manga: status, tags, series, publishers and collections, all in one place.',
      },
      {
        title: 'Goals & statistics',
        text: 'A yearly reading goal, a points system, a reading calendar and the full history of past years.',
      },
      {
        title: 'Simple sharing, together',
        text: 'Share your library with your household: everyone keeps their own books, but you see it all together.',
      },
    ],
    howTitle: 'How it works',
    steps: [
      {
        title: 'Scan or search',
        text: 'Add a book by scanning its ISBN or searching for it manually.',
      },
      {
        title: 'Track your progress',
        text: 'Reading status, ratings, yearly goal: your collection evolves with you.',
      },
      {
        title: 'Share',
        text: 'Invite your household to see their collection next to yours.',
      },
    ],
    pricingTitle: 'Pricing',
    pricingNote: "Preview — the app isn't open to the public yet.",
    pricing: [
      {
        name: 'Basic',
        price: 'Free',
        tagline: 'To discover your personal library.',
        items: ['Limited collection', 'ISBN scan', 'Basic statuses'],
      },
      {
        name: 'Premium',
        price: 'Coming soon',
        tagline: 'For dedicated readers.',
        items: ['Unlimited collection', 'Stats & goals', 'Full history'],
      },
      {
        name: 'Duo',
        price: 'Coming soon',
        tagline: 'To share with one other person.',
        items: ['Everything in Premium', 'Sharing for two', "See their activity"],
        highlighted: true,
        badge: 'Recommended',
      },
      {
        name: 'Family',
        price: 'Coming soon',
        tagline: 'For the whole family.',
        items: ['Everything in Duo', 'Multiple accounts', 'Permission management'],
      },
    ],
    finalCtaTitle: 'Ready to organize your library?',
    footer: 'Ex Libris',
    legalNotice: 'Legal notice',
    privacyPolicy: 'Privacy',
  },
}

const LanguageContext = createContext({ lang: 'fr', setLang: () => {} })

function useT() {
  const { lang } = useContext(LanguageContext)
  return STRINGS[lang]
}

function detectLang() {
  if (typeof window === 'undefined') return 'fr'
  const saved = window.localStorage.getItem(LANG_STORAGE_KEY)
  if (saved === 'fr' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export default function Landing() {
  const [lang, setLang] = useState(detectLang)

  useEffect(() => {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className="min-h-svh">
        <Nav />
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCta />
        <Footer />
      </div>
    </LanguageContext.Provider>
  )
}

function Nav() {
  const t = useT()
  return (
    <header className="sticky top-0 z-20 bg-paper/80 backdrop-blur border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="w-6 h-6" />
          <span className="font-serif text-lg font-semibold">Ex Libris</span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-ink/60">
          <a href="#features" className="hover:text-ink">
            {t.nav.features}
          </a>
          <a href="#pricing" className="hover:text-ink">
            {t.nav.pricing}
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <LangSwitch />
          <LoginCta className="rounded-sm bg-library text-white text-sm font-medium px-4 py-2 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library">
            {t.nav.login}
          </LoginCta>
        </div>
      </div>
    </header>
  )
}

function LangSwitch() {
  const { lang, setLang } = useContext(LanguageContext)
  return (
    <div
      role="group"
      aria-label="Langue / Language"
      className="flex items-center rounded-sm border border-ink/15 overflow-hidden text-xs font-mono"
    >
      <button
        type="button"
        onClick={() => setLang('fr')}
        aria-pressed={lang === 'fr'}
        title="Français"
        className={`px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
          lang === 'fr'
            ? 'bg-library text-white'
            : 'text-ink/50 hover:text-ink'
        }`}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        title="English"
        className={`px-2 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-library ${
          lang === 'en'
            ? 'bg-library text-white'
            : 'text-ink/50 hover:text-ink'
        }`}
      >
        EN
      </button>
    </div>
  )
}

function Hero() {
  const t = useT()
  return (
    <section id="top" className="pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <p className="hero-in font-yuyu text-xs tracking-widest text-library uppercase mb-4">
          {t.hero.eyebrow}
        </p>
        <h1
          className="hero-in font-serif text-4xl sm:text-6xl font-semibold leading-tight"
          style={{ animationDelay: '80ms' }}
        >
          {t.hero.titleLine1}
          <br />
          {t.hero.titleLine2}
        </h1>
        <p
          className="hero-in text-ink/60 text-lg mt-6 max-w-xl mx-auto"
          style={{ animationDelay: '160ms' }}
        >
          {t.hero.subtitle}
        </p>
        <div className="hero-in mt-8" style={{ animationDelay: '240ms' }}>
          <LoginCta className="inline-block rounded-sm bg-library text-white font-medium px-6 py-3 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library">
            {t.hero.cta}
          </LoginCta>
        </div>
      </div>

      <div className="hero-in mt-16" style={{ animationDelay: '320ms' }}>
        <ProductPreview />
      </div>
    </section>
  )
}

// Aperçu du produit plutôt que du design system : une étagère de livres
// d'exemple statiques (jamais de vraie donnée ni de logique de collection
// ici), qui reprend le vrai vocabulaire visuel de l'app — couverture
// BookCoverPlaceholder, tampon "Lu", ruban "Wishlist", bordure colorée par
// statut — avec une tranche et un fil de pages pour lire comme un objet
// plutôt qu'une vignette plate.
const PREVIEW_BOOKS = [
  { title: 'Fondation', author: 'Isaac Asimov', status: 'read' },
  { title: 'Dune', author: 'Frank Herbert', status: 'reading' },
  { title: 'One Piece', author: 'Eiichiro Oda', status: 'read' },
  { title: 'Watchmen', author: 'Alan Moore', status: 'read' },
  { title: 'Le Petit Prince', author: 'A. de Saint-Exupéry', status: 'to-read' },
  { title: 'Astérix chez les Pictes', author: 'Jean-Yves Ferri', status: 'wishlist' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', status: 'to-read' },
  { title: 'Les Misérables', author: 'Victor Hugo', status: 'read' },
  { title: 'Naruto', author: 'Masashi Kishimoto', status: 'reading' },
  { title: 'V pour Vendetta', author: 'Alan Moore', status: 'wishlist' },
  { title: '1984', author: 'George Orwell', status: 'read' },
  { title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', status: 'to-read' },
  { title: "L'Étranger", author: 'Albert Camus', status: 'read' },
  { title: 'Le Trône de Fer', author: 'George R. R. Martin', status: 'wishlist' },
  { title: 'Blacksad', author: 'Juan Díaz Canales', status: 'read' },
  { title: "Le Chant d'Achille", author: 'Madeline Miller', status: 'reading' },
]

const STATUS_ACCENT = {
  read: 'var(--color-library)',
  reading: 'var(--color-reading)',
  'to-read': 'var(--color-toread)',
  wishlist: 'var(--color-wishlist)',
}

// 6 colonnes sur grand écran, moins sur les écrans étroits (chacune reste
// assez large pour rester lisible) — vitesse de parallaxe différente par
// colonne pour un effet moins mécanique qu'un simple binôme.
const COLUMN_SPEEDS = [70, 190, 110, 250, 150, 220]
const COLUMN_VISIBILITY = ['flex', 'flex', 'hidden md:flex', 'hidden md:flex', 'hidden lg:flex', 'hidden lg:flex']

// Décale chaque colonne verticalement en fonction du scroll de la page (pas
// une animation qui tourne seule), à sa propre vitesse (`speeds[i]` = le
// déplacement max en px une fois le bloc entièrement traversé). Un seul
// listener pour toutes les colonnes. Ignoré si l'utilisateur préfère moins
// d'animations.
function useShelfParallax(containerRef, colRefs, speeds) {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = null
    function update() {
      frame = null
      const rect = container.getBoundingClientRect()
      const total = rect.height + window.innerHeight
      const scrolled = window.innerHeight - rect.top
      const progress = Math.min(1, Math.max(0, scrolled / total))
      colRefs.current.forEach((col, i) => {
        if (col) col.style.transform = `translateY(-${progress * speeds[i]}px)`
      })
    }
    function onScroll() {
      if (frame === null) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [containerRef, colRefs, speeds])
}

function ProductPreview() {
  const containerRef = useRef(null)
  const colRefs = useRef([])
  useShelfParallax(containerRef, colRefs, COLUMN_SPEEDS)

  const columns = COLUMN_SPEEDS.map((_, i) =>
    Array(4)
      .fill(PREVIEW_BOOKS.filter((_, idx) => idx % COLUMN_SPEEDS.length === i))
      .flat(),
  )

  return (
    <div ref={containerRef} className="shelf-fade relative w-full h-[480px] bg-paper overflow-hidden">
      <div className="flex gap-4 justify-center h-full px-4 pt-6">
        {columns.map((col, i) => (
          <div
            key={i}
            ref={(el) => {
              colRefs.current[i] = el
            }}
            className={`flex-col gap-4 w-36 shrink-0 ${COLUMN_VISIBILITY[i]}`}
          >
            {col.map((b, j) => (
              <MiniBook key={j} {...b} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniBook({ title, author, status }) {
  const accent = STATUS_ACCENT[status]
  return (
    <div className="flex shrink-0 rounded-sm overflow-hidden drop-shadow-lg">
      <div className="w-2 shrink-0" style={{ background: accent, filter: 'brightness(0.72)' }} />
      <div className="relative flex-1 min-w-0 border-t-4 bg-card" style={{ borderTopColor: accent }}>
        <div className="relative aspect-2/3">
          {status === 'read' && (
            <span className="absolute top-1.5 right-1.5 -rotate-6 border border-library text-library font-mono text-[8px] font-bold uppercase px-1 py-px rounded-sm bg-cover/90 z-10">
              Lu
            </span>
          )}
          {status === 'wishlist' && (
            <span className="absolute top-1.5 -left-7 w-24 -rotate-45 bg-wishlist text-white font-mono text-[7px] font-bold uppercase text-center py-px z-10">
              Wishlist
            </span>
          )}
          <BookCoverPlaceholder title={title} author={author} />
        </div>
        <div className="p-2">
          <p className="font-serif text-xs leading-snug truncate">{title}</p>
          <p className="text-[10px] text-ink/60 truncate">{author}</p>
        </div>
      </div>
      <div className="w-1 shrink-0 book-pages" />
    </div>
  )
}

function Features() {
  const t = useT()
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20">
      <Reveal>
        <h2 className="font-serif text-3xl font-semibold text-center mb-12">
          {t.featuresTitle}
        </h2>
      </Reveal>
      <div className="grid sm:grid-cols-2 gap-6">
        {t.features.map((f, i) => (
          <Reveal key={f.title} delay={i * 80}>
            <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6 h-full">
              <h3 className="font-serif text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-ink/60">{f.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const t = useT()
  return (
    <section className="bg-card/50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-center mb-12">
            {t.howTitle}
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8">
          {t.steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100} className="text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-library text-white font-mono flex items-center justify-center mb-4">
                {i + 1}
              </div>
              <h3 className="font-serif text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-ink/60">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const t = useT()
  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
      <Reveal>
        <h2 className="font-serif text-3xl font-semibold text-center mb-3">
          {t.pricingTitle}
        </h2>
        <p className="text-center text-sm text-ink/50 mb-12">{t.pricingNote}</p>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {t.pricing.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 100}>
            <div
              className={`relative rounded-sm p-6 h-full border-t-4 border-dashed shadow-sm ${
                tier.highlighted
                  ? 'bg-library text-white border-brass'
                  : 'bg-card border-brass'
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 right-4 bg-brass text-white text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-sm">
                  {tier.badge}
                </span>
              )}
              <h3 className="font-serif text-xl mb-1">{tier.name}</h3>
              <p
                className={`font-mono text-2xl font-semibold mb-2 ${tier.highlighted ? 'text-white' : 'text-library'}`}
              >
                {tier.price}
              </p>
              <p
                className={`text-sm mb-4 ${tier.highlighted ? 'text-white/80' : 'text-ink/60'}`}
              >
                {tier.tagline}
              </p>
              <ul className="space-y-2 text-sm">
                {tier.items.map((item) => (
                  <li
                    key={item}
                    className={tier.highlighted ? 'text-white/90' : 'text-ink/70'}
                  >
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function FinalCta() {
  const t = useT()
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 text-center">
      <Reveal>
        <h2 className="font-serif text-3xl font-semibold mb-4">{t.finalCtaTitle}</h2>
        <LoginCta className="inline-block rounded-sm bg-library text-white font-medium px-6 py-3 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library">
          {t.hero.cta}
        </LoginCta>
      </Reveal>
    </section>
  )
}

// Le clic sur "Se connecter" ouvre la connexion avec un volet vertical
// (glisse depuis le haut), pour se distinguer du volet horizontal utilisé
// pour ouvrir une fiche livre.
function LoginCta({ className, children }) {
  const navigate = useNavigate()

  function handleClick(e) {
    if (e.defaultPrevented || e.button !== 0) return
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
    e.preventDefault()
    navigateWithViewTransition(navigate, '/login', {
      direction: 'top',
      preload: () => import('./Login'),
    })
  }

  return (
    <Link to="/login" onClick={handleClick} className={className}>
      {children}
    </Link>
  )
}

function Footer() {
  const t = useT()
  return (
    <footer className="border-t border-ink/10 py-8">
      <div className="max-w-5xl mx-auto px-6 flex flex-col items-center gap-3 text-xs text-ink/40">
        <div className="flex items-center gap-4">
          <Link to="/mentions-legales" className="hover:text-ink/70">
            {t.legalNotice}
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/confidentialite" className="hover:text-ink/70">
            {t.privacyPolicy}
          </Link>
        </div>
        <p>{t.footer}</p>
      </div>
    </footer>
  )
}

// Fait apparaître son contenu (fondu + léger glissement) quand il entre
// dans le viewport, plutôt que tout afficher d'un bloc au chargement.
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
