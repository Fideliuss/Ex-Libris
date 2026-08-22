# Ex Libris

PWA personnelle de gestion de collection de livres (remplaçante de Libib + Excel).

## Stack

- Vite + React (JavaScript)
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- `html5-qrcode` pour le scan de code-barres ISBN
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
  (a besoin d'HTTPS + d'un vrai appareil). Voir la section suivante si
  besoin de le tester avant de livrer.

## Workflow de contribution

GitFlow simplifié, pour ne jamais déclencher un build Netlify (payant en
crédits) en dehors d'un vrai merge sur `main` :

- `develop` est la branche de travail. Chaque fonctionnalité part d'une
  branche `feature/xxx` créée depuis `develop`.
- Commits au format [conventionnel](https://www.conventionalcommits.org/) :
  `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` — indispensable pour que
  le versionnage automatique fonctionne.
- Chaque `feature/xxx` termine par une pull request vers `develop`. La CI
  (`.github/workflows/build-check.yml`) lance `npm ci && npm run build` sur
  chaque PR et doit passer avant merge.
- `main` et `develop` sont protégées : push direct interdit, merge
  uniquement via PR avec la CI au vert.
- Quand `develop` est stable, ouvrir une PR de `develop` vers `main`.
- `release-please` (`.github/workflows/release-please.yml`) tourne à chaque
  push sur `main` : il maintient une PR de release à jour avec le
  changelog et le bump de version (patch/minor/major selon les commits
  conventionnels). Merger cette PR crée le tag Git correspondant.
- Netlify ne surveille que `main` (branch deploys et previews désactivés).
- Protection des branches via [Repository Rulesets](https://github.com/Fideliuss/ma-bibliotheque/rules) (pas l'ancienne "branch protection" classique, qui ne bloque pas vraiment les push directs quand 0 review est requise).
