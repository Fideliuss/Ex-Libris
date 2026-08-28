import { Link } from 'react-router-dom'

// Contenu rédigé à partir de ce que l'app fait réellement (pas un modèle
// générique) : relire et ajuster si le fonctionnement change (nouveau
// sous-traitant, nouvelle donnée collectée, etc.).
export default function PrivacyPolicy() {
  return (
    <div className="min-h-svh p-6">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="text-sm text-ink/60 hover:text-ink underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-library rounded-sm"
        >
          ← Retour à l'accueil
        </Link>

        <h1 className="font-serif text-3xl font-semibold mt-6 mb-2">
          Politique de confidentialité
        </h1>
        <p className="text-sm text-ink/50 mb-10">Dernière mise à jour : 2026</p>

        <div className="space-y-8 text-sm text-ink/80 leading-relaxed">
          <Section title="Quelles données sont collectées">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Compte</strong> : email, mot de passe (jamais stocké en
                clair — géré par le système d'authentification de Supabase),
                et si tu les renseignes à l'inscription ou via une connexion
                Google : prénom, nom, photo de profil Google.
              </li>
              <li>
                <strong>Contenu de ta bibliothèque</strong> : les livres que tu
                ajoutes (titre, auteur, notes personnelles, dates de lecture,
                prix d'achat, etc.), et les couvertures que tu importes ou
                photographies.
              </li>
              <li>
                <strong>Partage</strong> : si tu échanges un code ami avec un
                autre compte, ton nom affiché et ton email lui deviennent
                visibles, et vice versa.
              </li>
            </ul>
          </Section>

          <Section title="Pourquoi ces données">
            <p>
              Uniquement pour faire fonctionner l'application : t'authentifier,
              afficher ta collection, et — si tu l'actives —
              partager ta bibliothèque en lecture seule avec un autre compte.
              Aucune donnée n'est vendue, louée, ou utilisée à des fins
              publicitaires.
            </p>
          </Section>

          <Section title="Qui héberge et traite ces données">
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Supabase</strong> (base de données, authentification,
                stockage des couvertures) — sous-traitant technique de
                l'hébergement des données de l'application.
              </li>
              <li>
                <strong>Netlify</strong> (hébergement du site).
              </li>
              <li>
                <strong>Google</strong>, uniquement si tu choisis de te
                connecter via "Continuer avec Google".
              </li>
            </ul>
          </Section>

          <Section title="Services tiers appelés lors d'une recherche">
            <p>
              Quand tu scannes ou saisis un ISBN pour remplir automatiquement
              une fiche, cet ISBN est envoyé à Google Books, Open Library, et
              au catalogue de la BNF (Bibliothèque nationale de France) pour
              récupérer titre/auteur/couverture. Aucune autre information que
              l'ISBN n'est transmise à ces services.
            </p>
          </Section>

          <Section title="Cookies et stockage local">
            <p>
              L'application n'utilise aucun cookie ni traceur publicitaire ou
              statistique. Le stockage local du navigateur (localStorage) sert
              uniquement à garder ta session connectée et tes préférences
              d'affichage (langue, thème) — rien n'est transmis à un tiers.
            </p>
          </Section>

          <Section title="Combien de temps ces données sont conservées">
            <p>
              Tant que ton compte existe. Il n'y a pas encore de suppression
              de compte en libre-service dans l'application ; pour supprimer
              ton compte et tes données, contacte-nous à l'adresse ci-dessous.
            </p>
          </Section>

          <Section title="Tes droits">
            <p>
              Tu peux à tout moment : exporter l'intégralité de ta
              bibliothèque toi-même (Compte → Bibliothèque → Exporter),
              demander l'accès, la rectification ou la suppression de tes
              données en nous contactant.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Pour toute question ou demande concernant tes données :{' '}
              <span className="font-mono">[EMAIL DE CONTACT À COMPLÉTER]</span>
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
