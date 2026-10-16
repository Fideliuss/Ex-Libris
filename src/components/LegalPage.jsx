import { Link } from 'react-router-dom'
import { backLinkClass } from '../lib/ui'

// Gabarit commun des pages légales : lien de retour, titre, sections.
export default function LegalPage({ title, subtitle, children }) {
  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className={backLinkClass}>
          ← Retour à l'accueil
        </Link>

        <h1 className={`font-serif text-3xl font-semibold mt-6 ${subtitle ? 'mb-2' : 'mb-10'}`}>
          {title}
        </h1>
        {subtitle && <p className="text-sm text-ink/70 mb-10">{subtitle}</p>}

        <div className="space-y-8 text-sm text-ink/80 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="font-serif text-lg font-semibold text-ink mb-2">{title}</h2>
      {children}
    </section>
  )
}
