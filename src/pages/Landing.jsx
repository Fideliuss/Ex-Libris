import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const FEATURES = [
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
]

const STEPS = [
  { title: 'Scanne ou cherche', text: 'Ajoute un livre en scannant son ISBN ou en le cherchant à la main.' },
  { title: 'Suis ta progression', text: 'Statut de lecture, notes, objectif annuel : ta collection évolue avec toi.' },
  { title: 'Partage', text: 'Invite ton foyer pour voir sa collection à côté de la tienne.' },
]

const PRICING = [
  {
    name: 'Solo',
    price: 'Gratuit',
    tagline: 'Pour gérer ta bibliothèque personnelle.',
    items: ['Collection illimitée', 'Scan ISBN', 'Statistiques & objectifs'],
  },
  {
    name: 'Foyer',
    price: 'Bientôt',
    tagline: 'Partage ta bibliothèque avec ton foyer.',
    items: ['Tout Solo', 'Partage à deux', "Vue sur l'activité de l'autre"],
    highlighted: true,
  },
]

export default function Landing() {
  return (
    <div className="min-h-svh">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FinalCta />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-20 bg-paper/80 backdrop-blur border-b border-ink/10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <img src="/favicon.svg" alt="" className="w-6 h-6" />
          <span className="font-serif text-lg font-semibold">Ma Bibliothèque</span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-ink/60">
          <a href="#features" className="hover:text-ink">
            Fonctionnalités
          </a>
          <a href="#pricing" className="hover:text-ink">
            Tarifs
          </a>
        </nav>
        <Link
          to="/login"
          className="rounded-sm bg-library text-white text-sm font-medium px-4 py-2 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
        >
          Se connecter
        </Link>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
      <p className="hero-in font-mono text-xs tracking-widest text-library uppercase mb-4">
        Ta collection, enfin bien rangée
      </p>
      <h1
        className="hero-in font-serif text-4xl sm:text-6xl font-semibold leading-tight"
        style={{ animationDelay: '80ms' }}
      >
        Livres, BD et mangas.
        <br />
        Une seule bibliothèque.
      </h1>
      <p
        className="hero-in text-ink/60 text-lg mt-6 max-w-xl mx-auto"
        style={{ animationDelay: '160ms' }}
      >
        Scanne, classe, suis tes objectifs de lecture et partage le tout avec
        ton foyer.
      </p>
      <div className="hero-in mt-8" style={{ animationDelay: '240ms' }}>
        <Link
          to="/login"
          className="inline-block rounded-sm bg-library text-white font-medium px-6 py-3 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
        >
          Se connecter
        </Link>
      </div>

      <div className="hero-in mt-16" style={{ animationDelay: '320ms' }}>
        <ShelfMockup />
      </div>
    </section>
  )
}

// Mur de couvertures illustratif (rectangles colorés), pour donner une idée
// de la collection sans dépendre d'une vraie capture d'écran.
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
  return (
    <div className="bg-card border-t-4 border-dashed border-brass rounded-sm shadow-sm p-6 max-w-md mx-auto">
      <div className="flex flex-wrap gap-2 justify-center">
        {spines.map((c, i) => (
          <div
            key={i}
            className={`w-10 aspect-[2/3] rounded-sm ${c}`}
            style={{ opacity: 0.85 }}
          />
        ))}
      </div>
    </div>
  )
}

function Features() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20">
      <Reveal>
        <h2 className="font-serif text-3xl font-semibold text-center mb-12">
          Fonctionnalités
        </h2>
      </Reveal>
      <div className="grid sm:grid-cols-2 gap-6">
        {FEATURES.map((f, i) => (
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
  return (
    <section className="bg-card/50 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-center mb-12">
            Comment ça marche
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map((s, i) => (
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
  return (
    <section id="pricing" className="max-w-5xl mx-auto px-6 py-20">
      <Reveal>
        <h2 className="font-serif text-3xl font-semibold text-center mb-3">
          Tarifs
        </h2>
        <p className="text-center text-sm text-ink/50 mb-12">
          Aperçu — l'application n'est pas encore ouverte au public.
        </p>
      </Reveal>
      <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {PRICING.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 100}>
            <div
              className={`rounded-sm p-6 h-full border-t-4 border-dashed shadow-sm ${
                tier.highlighted
                  ? 'bg-library text-white border-brass'
                  : 'bg-card border-brass'
              }`}
            >
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
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 text-center">
      <Reveal>
        <h2 className="font-serif text-3xl font-semibold mb-4">
          Prêt·e à ranger ta bibliothèque ?
        </h2>
        <Link
          to="/login"
          className="inline-block rounded-sm bg-library text-white font-medium px-6 py-3 hover:bg-library/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-library"
        >
          Se connecter
        </Link>
      </Reveal>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-ink/10 py-8">
      <div className="max-w-5xl mx-auto px-6 text-center text-xs text-ink/40">
        Ma Bibliothèque
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
