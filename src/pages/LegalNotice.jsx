import { Link } from 'react-router-dom'
import LegalPage, { LegalSection } from '../components/LegalPage'
import { CONTACT_EMAIL } from '../lib/legal'

export default function LegalNotice() {
  return (
    <LegalPage title="Mentions légales">
      <LegalSection title="Éditeur du site">
        <p>
          Ex Libris est un site édité à titre non professionnel par :
          <br />
          <span className="font-mono">Brayan Cuvelier</span>
          <br />
          Contact :{' '}
          <span className="font-mono">{CONTACT_EMAIL}</span>
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
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
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
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
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question relative au site :{' '}
          <span className="font-mono">{CONTACT_EMAIL}</span>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
