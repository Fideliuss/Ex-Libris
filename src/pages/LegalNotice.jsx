import { Link } from 'react-router-dom'

export default function LegalNotice() {
  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à l'accueil
        </Link>

        <h1 className="font-serif text-3xl font-semibold mt-6 mb-10">
          Mentions légales
        </h1>

        <div className="space-y-8 text-sm text-ink/80 leading-relaxed">
          <Section title="Éditeur du site">
            <p>
              Ex Libris est un site édité à titre non professionnel par :
              <br />
              <span className="font-mono">Brayan Cuvelier</span>
              <br />
              Contact :{' '}
              <span className="font-mono">
                exlibris.contact.raven385@passmail.com
              </span>
            </p>
          </Section>

          <Section title="Hébergement">
            <p>
              Le site est hébergé par Netlify, Inc.
              <br />
              Plus d'informations :{' '}
              <a
                href="https://www.netlify.com/legal/"
                target="_blank"
                rel="noreferrer"
                className="text-library underline underline-offset-2 hover:text-library/80"
              >
                netlify.com/legal
              </a>
            </p>
            <p className="mt-2">
              La base de données et l'authentification sont hébergées par
              Supabase (sous-traitant technique) — voir la{' '}
              <Link
                to="/confidentialite"
                className="text-library underline underline-offset-2 hover:text-library/80"
              >
                politique de confidentialité
              </Link>{' '}
              pour le détail des services utilisés.
            </p>
          </Section>

          <Section title="Propriété intellectuelle">
            <p>
              Le code source et le contenu de ce site sont protégés par le
              droit d'auteur. Toute reproduction sans autorisation est
              interdite. Les données de ta propre bibliothèque
              (livres, notes, couvertures que tu ajoutes) t'appartiennent —
              voir la{' '}
              <Link
                to="/confidentialite"
                className="text-library underline underline-offset-2 hover:text-library/80"
              >
                politique de confidentialité
              </Link>{' '}
              pour savoir comment les récupérer ou les supprimer.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question relative au site :{' '}
              <span className="font-mono">
                exlibris.contact.raven385@passmail.com
              </span>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-serif text-lg font-semibold text-ink mb-2">
        {title}
      </h2>
      {children}
    </section>
  )
}
