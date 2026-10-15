# Ex Libris

![build-check](https://github.com/Fideliuss/Ex-Libris/actions/workflows/build-check.yml/badge.svg)

Ex Libris est une application web installable (PWA) pour suivre une bibliothèque personnelle : livres, BD, comics et mangas. Elle a remplacé un tableur que deux personnes se passaient. Chaque compte garde ses propres livres ; les membres d'un même foyer peuvent consulter la bibliothèque des autres, en lecture seule.

L'usage visé est familial, quelques comptes tout au plus. L'application n'est pas pensée pour une diffusion publique à grande échelle.

## Ce que l'application fait

**Collection**
- Fiche livre : titre, auteurs, traducteur, illustrateur, éditeur, collection, série et tome, univers, tags, format et reliure, statut (wishlist, à lire, en cours, lu), note à la demi-étoile, prix et date d'achat, dates de lecture, notes libres et citation favorite.
- Recherche et filtres qui se limitent entre eux, tri sur sept critères, index alphabétique, sélection multiple avec modification en masse.
- Onglets Collection, Wishlist et « À compléter » (livres auxquels il manque ISBN, couverture, auteur, éditeur, pages, résumé, format ou reliure).

**Ajout d'un livre**
- Scan du code-barres ISBN à la caméra, ou saisie à la main. La recherche interroge Google Books, puis Open Library, puis le catalogue de la BNF, qui comble les éditions françaises que les deux autres ratent souvent.
- Couverture par URL, import de fichier, glisser-déposer ou photo. L'image est réduite et convertie en WebP avant l'envoi, et seulement quand le livre est enregistré.
- Import depuis Libib (CSV) ou My Library (Excel), sans doublons si on réimporte le même fichier. Export CSV de sa propre bibliothèque.

**Suivi de lecture**
- Objectif annuel avec un barème par type (1 point par livre, 0,5 par BD ou comics, un tiers par manga) et historique année par année.
- Statistiques : rythme de lecture, notes, calendrier des livres terminés, répartition par type, tag, éditeur, collection et série.
- Succès à paliers, présentés comme des plaques d'ex-libris.

**Partage et compte**
- Foyer à plusieurs membres, constitué par échange de codes ami. Un sélecteur permet de basculer d'une bibliothèque à l'autre dans la collection, les statistiques et les succès.
- Thème clair, sombre ou automatique, tutoriel de première connexion, fenêtre « Quoi de neuf », suppression complète du compte.

## Technologies

| Rôle | Choix |
|---|---|
| Interface | React 19, React Router 7, Tailwind CSS 4 |
| Build | Vite, `vite-plugin-pwa` |
| Données et authentification | Supabase (Postgres, Auth, Row Level Security, Storage) |
| Scan, CSV, Excel | `html5-qrcode`, `papaparse`, `xlsx` |
| Tests | Vitest, pgTAP |
| Qualité | oxlint |
| Hébergement | Netlify |

`xlsx` est installé depuis le build officiel de SheetJS et non depuis npm, dont la version publiée a des vulnérabilités connues non corrigées. Cette bibliothèque pèse environ 360 ko : elle n'est chargée qu'à l'import d'un fichier Excel.

## Démarrer

Prérequis : Node 22, et un projet Supabase dont le schéma est en place (voir « Base de données »).

```bash
npm install
cp .env.example .env
npm run dev
```

Renseignez dans `.env` l'URL du projet et sa clé publique (`anon`) :

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Le fichier `.env` ne doit jamais être commité.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (sans service worker) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Sert `dist/` sur le port 4173, service worker compris |
| `npm run lint` | Vérification avec oxlint |
| `npm test` | Tests unitaires, une passe |
| `npm run test:watch` | Tests unitaires en continu |

## Organisation du code

```
src/
  pages/        écrans, une route chacun (chargés à la demande)
  components/   composants d'interface ; stats/ pour les blocs de la page Statistiques
  context/      fournisseurs (session, profil, livres du foyer, tutoriel, nouveautés)
  hooks/        hooks partagés et contextes associés
  lib/          logique sans React : accès Supabase, imports, succès, filtres, dates
supabase/
  migrations/   schéma complet (baseline.sql)
  tests/        tests pgTAP des politiques d'accès
```

Les livres visibles (les miens et ceux du foyer) sont chargés une fois à la connexion et partagés entre les pages par `LibraryDataProvider`. Les écritures mettent ce cache à jour directement ; il se recharge aussi en arrière-plan s'il a plus d'une minute.

## Tests

Les tests unitaires (`npm test`) couvrent la logique de `src/lib/` : imports Libib et My Library, plan d'import, filtres et facettes, calcul des succès, points de lecture, export CSV, règles du cache. Ils ne touchent ni au réseau ni au DOM. Le rendu et les interactions des composants se vérifient à la main avant chaque livraison, et le scan à la caméra demande en plus HTTPS et un vrai téléphone.

Les politiques d'accès de la base sont testées avec [pgTAP](https://pgtap.org/) via la CLI Supabase, qui demande Docker :

```bash
supabase start -x analytics -x edge-runtime -x functions -x imgproxy \
  -x inbucket -x meta -x storage -x studio -x vector
supabase test db supabase/tests/database
supabase stop
```

Le workflow `rls-tests` lance cette suite sur les pull requests qui modifient `supabase/`.

## Base de données

Le schéma tient dans un seul fichier, `supabase/migrations/20260101000000_baseline.sql`. Il décrit les tables `profiles`, `households`, `household_invites`, `books`, `reading_goals` et `achievement_claims`, le bucket de stockage `covers` et les fonctions SQL associées. La sécurité par ligne est activée partout : chacun lit et écrit ses données, les membres d'un foyer lisent celles des autres.

Ce fichier sert à construire une base vierge (nouveau projet, tests locaux). Sur le projet Supabase réel, les changements s'appliquent à la main, par le SQL Editor du tableau de bord ou par `supabase db query --linked`. N'utilisez pas `supabase db push` : l'historique de migrations du projet distant est vide, la commande rejouerait tout le fichier.

## Déploiement

Netlify construit le site à chaque fusion sur `main` (`netlify.toml`) et redirige toutes les routes vers `index.html`. Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont à définir dans les réglages du site.

## Contribuer

La façon de travailler (branches, revues, livraison vers `main`, versions) est décrite dans [CONTRIBUTING.md](CONTRIBUTING.md). L'historique des versions est dans [CHANGELOG.md](CHANGELOG.md).

## Licence

Tous droits réservés, voir [LICENSE](LICENSE).
