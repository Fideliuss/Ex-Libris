# Ma Bibliothèque

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
