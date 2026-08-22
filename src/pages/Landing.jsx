import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
          <Link
            to="/login"
            className="rounded-sm bg-library text-white text-sm font-medium px-4 py-2 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
          >
            {t.nav.login}
          </Link>
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
    <section id="top" className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
      <p className="hero-in font-mono text-xs tracking-widest text-library uppercase mb-4">
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
        <Link
          to="/login"
          className="inline-block rounded-sm bg-library text-white font-medium px-6 py-3 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
        >
          {t.hero.cta}
        </Link>
      </div>

      <div className="hero-in mt-16" style={{ animationDelay: '320ms' }}>
        <ShelfMockup />
      </div>
    </section>
  )
}

// Étagère illustrative (rectangles colorés) qui défile en boucle infinie,
// pour donner une idée de la collection sans dépendre d'une vraie capture
// d'écran. Le tableau est dupliqué : la piste fait 200% de large et
// l'animation glisse de 0 à -50%, ce qui boucle sans à-coup sur la copie.
function ShelfMockup() {
  const spines = [
    'bg-library',
    'bg-brass',
    'bg-wishlist',
    'bg-reading',
    'bg-stamp/70',
    'bg-library/70',
    'bg-brass/70',
    'bg-wishlist/70',
    'bg-reading/70',
    'bg-library',
    'bg-brass',
    'bg-wishlist',
  ]
  const track = [...spines, ...spines]
  return (
    <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm py-6 overflow-hidden">
      <div className="marquee flex gap-2 w-max">
        {track.map((c, i) => (
          <div
            key={i}
            className={`w-10 aspect-[2/3] rounded-sm shrink-0 ${c}`}
            style={{ opacity: 0.85 }}
          />
        ))}
      </div>
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
        <Link
          to="/login"
          className="inline-block rounded-sm bg-library text-white font-medium px-6 py-3 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
        >
          {t.hero.cta}
        </Link>
      </Reveal>
    </section>
  )
}

function Footer() {
  const t = useT()
  return (
    <footer className="border-t border-ink/10 py-8">
      <div className="max-w-5xl mx-auto px-6 text-center text-xs text-ink/40">
        {t.footer}
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
