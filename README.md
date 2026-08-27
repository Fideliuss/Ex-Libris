# Ex Libris

![build-check](https://github.com/Fideliuss/ma-bibliotheque/actions/workflows/build-check.yml/badge.svg)

PWA personnelle de gestion de bibliothèque (livres, BD, comics, mangas),
née pour remplacer un tableur Excel qu'on se repassait à deux. Chacun garde
ses propres livres ; deux comptes qui s'échangent un code ami voient leurs
bibliothèques respectives côte à côte, en lecture seule.

## Fonctionnalités

- Fiche livre complète : titre, auteur, traducteur, illustrateur, éditeur,
  collection, série/tome, univers (BD), tags, statut, note, prix, dates,
  notes libres.
- Scan de code-barres ISBN à la caméra, avec recherche automatique en
  cascade sur Google Books, Open Library, puis le catalogue SRU de la BNF
  en dernier recours — les deux premiers ratent souvent les éditions
  françaises.
- Couverture par URL, import de fichier, ou photo prise directement depuis
  le formulaire (utile sans connexion internet correcte).
- Import depuis un export Libib (CSV) ou My Library (Excel), avec
  dédoublonnage par ISBN.
- Export CSV de sa propre bibliothèque.
- Partage en lecture seule entre deux comptes via un code ami échangé à la
  main — pas de foyer figé à l'avance, n'importe quel compte peut inviter
  n'importe quel autre.
- Statistiques : objectif de lecture annuel (système de points par type),
  historique année par année, rythme de lecture, notes, calendrier façon
  GitHub des livres terminés, répartition par tag/éditeur/collection/série.
- Installable comme PWA.

## Stack

- Vite + React (JavaScript)
- Tailwind CSS v4
- Supabase (Postgres + Auth + Row Level Security)
- `html5-qrcode` pour le scan de code-barres
- `papaparse` pour le CSV, `xlsx` (build SheetJS, pas le paquet npm — voir
  plus bas) pour l'Excel
- `vite-plugin-pwa` pour l'installabilité
- Déploiement Netlify

## Développement

```bash
npm install
cp .env.example .env   # puis renseigner VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

## Variables d'environnement

Voir `.env.example`. Ne jamais commiter `.env`.

## Build

```bash
npm run build
npm run preview
```

## Tester en local avant de livrer

Netlify (plan gratuit) a un quota de crédits limité — chaque déploiement
(chaque push sur `main`) en consomme. Pour ne pas le griller :

- Développement courant : `npm run dev` (rechargement à chaud, mais pas de
  service worker/PWA — normal en mode dev).
- **Avant d'ouvrir une PR `develop → main`** : valider la vraie build de
  prod en local, PWA comprise :
  ```bash
  npm run build
  npm run preview   # sert dist/ sur http://localhost:4173, avec service worker
  ```
  Vérifier qu'il n'y a pas d'erreur console et que l'écran de connexion (au
  minimum) s'affiche correctement.
- Grouper plusieurs fonctionnalités sur `develop` avant de livrer, plutôt
  que d'ouvrir une PR vers `main` à chaque petit changement — chaque
  promotion vers `main` = un déploiement Netlify.
- Le seul cas qui échappe au test local : le scan caméra sur téléphone
  (a besoin d'HTTPS + d'un vrai appareil).

## Tests unitaires (Vitest)

```bash
npm run test         # une passe
npm run test:watch   # mode watch pendant le dev
```

Couvre les fonctions pures de `src/lib/` : parsing des imports Libib/My
Library, extraction série/tome, tri des auteurs par nom de famille, calcul
des points de lecture, génération du CSV d'export. Pas de mock Supabase —
ces fonctions ne touchent ni le réseau ni le DOM, elles prennent des
données en entrée et renvoient un résultat. `src/lib/authorSort.js` a été
extrait de `Collection.jsx` uniquement pour ça : importer la page
directement aurait entraîné l'initialisation du client Supabase (donc un
échec en CI, où `.env` n'existe pas).

Ne couvre pas le rendu ni les interactions des composants React — ça reste
vérifié à la main en local avant chaque livraison.

## Tests RLS (pgTAP)

Les policies RLS (`books`, `household_links`, `profiles`,
`find_user_by_code`) sont testées avec [pgTAP](https://pgtap.org/) via la
CLI Supabase — c'est elles qui ont causé les deux bugs de sécurité les
plus sérieux du projet jusqu'ici, donc ça vaut le coup de les couvrir.
Nécessite [Docker Desktop](https://www.docker.com/products/docker-desktop/)
(une seule fois) :

```bash
# Coupe les services inutiles pour pgTAP (Studio/Storage/etc.). Garde kong/
# rest/realtime : le health-check interne de `supabase start` échoue sinon.
supabase start -x analytics -x edge-runtime -x functions -x imgproxy \
  -x inbucket -x meta -x storage -x studio -x vector

supabase test db supabase/tests/database

supabase stop   # quand t'as fini, libère les conteneurs
```

Les fichiers de test vivent dans `supabase/tests/database/`. Le schéma
utilisé pour les lancer — et pour reconstruire la vraie base depuis zéro
le cas échéant — est `supabase/migrations/20260101000000_baseline.sql` :
c'est le seul et unique fichier de référence, rien à garder synchronisé
ailleurs. Tourne automatiquement via `.github/workflows/rls-tests.yml`,
mais seulement sur les PR qui touchent à `supabase/` — inutile de payer
~2 min de démarrage Docker pour une PR qui ne change que du React. Ce
n'est pas un check obligatoire pour merger (seul `build` l'est), donc
aucun risque qu'une PR reste bloquée si le workflow ne se déclenche pas.

Ce que cette suite ne couvre pas : la logique React elle-même (formulaires,
imports, stats), et les policies de stockage (upload des couvertures).

## Base de données

Schéma géré à la main : les changements sont écrits dans
`supabase/migrations/20260101000000_baseline.sql`, puis copiés-collés dans
le SQL Editor de Supabase (Dashboard → SQL Editor) sur le vrai projet — pas
de `supabase db push` automatisé vers la prod. Le fichier de migration sert
uniquement à faire tourner une base locale identique pour les tests pgTAP.

Cinq tables, RLS activée partout : `books`, `reading_goals`,
`household_links`, `profiles`, et le bucket de stockage `covers`. Deux
fonctions `security definer` à accès restreint (`find_user_by_code`,
`generate_friend_code`) pour la résolution de code ami sans exposer toute
la table `profiles`.

## Workflow de contribution

GitFlow simplifié, pour ne jamais déclencher un build Netlify (payant en
crédits) en dehors d'un vrai merge sur `main` :

- `develop` est la branche de travail. Chaque fonctionnalité part d'une
  branche `feature/xxx` créée depuis `develop`.
- Commits au format [conventionnel](https://www.conventionalcommits.org/) :
  `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` — indispensable pour que
  le versionnage automatique fonctionne.
- Chaque `feature/xxx` termine par une pull request vers `develop`. La CI
  (`.github/workflows/build-check.yml`) lance `npm ci`, `npm run lint`,
  `npm run test` et `npm run build` sur chaque PR, et doit passer avant
  merge. Les tests pgTAP
  (`.github/workflows/rls-tests.yml`, voir plus haut) tournent en plus sur
  les PR qui touchent `supabase/`, à titre informatif.
- `main` et `develop` sont protégées : push direct interdit, merge
  uniquement via PR avec la CI au vert.
- Quand `develop` est stable, ouvrir une PR de `develop` vers `main`.
- `release-please` (`.github/workflows/release-please.yml`) tourne à chaque
  push sur `main` : il maintient une PR de release à jour avec le
  changelog et le bump de version (patch/minor/major selon les commits
  conventionnels). Merger cette PR crée le tag Git correspondant.
- Netlify ne surveille que `main` (branch deploys et previews désactivés).
- Protection des branches via [Repository Rulesets](https://github.com/Fideliuss/ma-bibliotheque/rules)
  (pas l'ancienne "branch protection" classique, qui ne bloque pas
  vraiment les push directs quand 0 review est requise).

## Licence

Tous droits réservés — voir [`LICENSE`](LICENSE).

## État du projet

Usage familial (2-3 comptes), pas pensé pour un déploiement public à
grande échelle. Les fonctions pures (`src/lib/`) et les policies RLS sont
testées automatiquement ; le rendu et les interactions des composants
React (formulaires, filtres, panneaux) se vérifient encore à la main
avant chaque livraison. `xlsx` est installé depuis le build SheetJS
officiel plutôt que le paquet npm, qui traîne deux CVE non corrigés.
