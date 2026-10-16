# Contribuer à Ex Libris

Ce document décrit comment le projet se développe et se livre. Pour installer et lancer l'application, voir le [README](README.md).

## Branches

- `develop` est la branche de travail. Chaque changement part d'une branche dédiée créée depuis `develop` (`feature/...`, `fix/...`, `refactor/...`, `chore/...`) et revient dans `develop` par pull request.
- `main` est la production. Netlify ne surveille que cette branche, sans déploiement de branches ni de prévisualisations.
- `main` et `develop` sont protégées par des [rulesets GitHub](https://github.com/Fideliuss/Ex-Libris/rules) : pas de push direct, fusion uniquement par pull request avec la CI au vert. Les rulesets sont préférés à l'ancienne protection de branche, qui ne bloque pas vraiment les push directs quand aucune revue n'est exigée.
- Une branche part toujours d'un `develop` à jour. Les branches ne s'empilent pas : la suivante est créée après la fusion de la précédente. Les pull requests vers `develop` se fusionnent en **squash** (un commit par pull request) ; celle de `develop` vers `main` se fusionne avec un **commit de fusion** (une fusion par version). GitHub l'impose.

## Commits

Format [Conventional Commits](https://www.conventionalcommits.org/) : `feat:`, `fix:`, `perf:`, `refactor:`, `test:`, `docs:`, `chore:`. Un commit par sujet, pour que l'historique se lise et que chaque partie se retire seule.

## Intégration continue

Sur chaque pull request vers `main` ou `develop`, `build-check` lance `npm ci`, `npm run lint`, `npm run test` et `npm run build`. C'est le seul contrôle obligatoire pour fusionner.

`rls-tests` lance les tests pgTAP, uniquement sur les pull requests qui modifient `supabase/` (le démarrage de Docker prend environ deux minutes, inutile pour un changement purement React). Il n'est pas obligatoire, mais on ne fusionne pas un changement de base s'il est rouge.

## Vérifier en local avant de livrer

Netlify (offre gratuite) a un quota de crédits : chaque déploiement en consomme un. On évite donc de livrer au fil de l'eau.

- Au quotidien : `npm run dev` (rechargement à chaud, sans service worker).
- Avant d'ouvrir la pull request `develop` vers `main` : `npm run build` puis `npm run preview`, qui sert la vraie build avec le service worker sur `http://localhost:4173`. Vérifier qu'il n'y a pas d'erreur dans la console et que l'écran de connexion s'affiche.
- Regrouper plusieurs changements sur `develop` avant de livrer. Chaque fusion sur `main` est un déploiement.
- Le scan caméra est le seul cas qu'un test local ne couvre pas : il faut HTTPS et un vrai téléphone.

## Base de données

Le schéma est un fichier unique, `supabase/migrations/20260101000000_baseline.sql`, qu'on modifie directement. On n'ajoute pas de fichier de migration à côté : une base neuve et la production divergeraient en silence.

Pour appliquer un changement au projet Supabase réel :

1. Écrire le changement dans `baseline.sql` et faire passer `rls-tests`.
2. Isoler l'instruction SQL exacte du changement (un `alter`, un `create policy`...), la relire et la valider avant de l'appliquer.
3. L'exécuter dans le SQL Editor du tableau de bord, ou avec `supabase db query --linked`.
4. Vérifier le résultat en lecture (`pg_policies`, `pg_proc`...).

On n'utilise pas `supabase db push` : l'historique de migrations du projet distant est vide, la commande rejouerait toute la baseline sur la production.

## Livrer vers `main`

Une promotion `develop` vers `main` déclenche un déploiement. On la prépare dans cet ordre :

1. Lister les commits et pull requests de `develop` absents de `main` : c'est le périmètre de la promotion.
2. Vérifier que les changements de base du lot sont déjà appliqués au projet réel.
3. Choisir le numéro de version (semver) : MINOR s'il y a au moins une vraie fonctionnalité, PATCH s'il n'y a que des corrections.
4. Créer la branche `chore/prepare-vX.Y.Z` depuis un `develop` à jour.
5. Ajouter l'entrée de `CHANGELOG.md` (historique technique, une section datée par version), si le lot change quelque chose de visible.
6. Ajouter l'entrée de `src/lib/whatsNew.js` si le lot mérite une annonce : texte pour l'utilisateur, affiché par la fenêtre « Quoi de neuf ». Distinct du changelog.
7. Mettre à jour la version dans `package.json` et `package-lock.json`.
8. Lancer `npm run build && npm run lint && npm test` en local.
9. Ouvrir la pull request vers `develop`, intitulée `chore: prepare vX.Y.Z release`. La fusionner en squash une fois la CI verte, puis mettre `develop` à jour.
10. Ouvrir la pull request `develop` vers `main`, intitulée `chore(main): promote develop to production (vX.Y.Z)`.
11. Attendre la CI, y compris `promotion-checklist`, qui vérifie que `CHANGELOG.md` et `package.json` sont dans le diff.
12. Fusionner avec un commit de fusion, jamais en squash, pour garder l'historique des pull requests.
13. Poser un tag léger `ExLibris-vX.Y.Z` sur le commit de fusion (GitHub le signe : badge « Verified »), puis créer la release avec `gh release create`.
14. Contrôler le site déployé : pas d'erreur console, nouveauté visible.

Les versions publiées sont listées dans les [releases GitHub](https://github.com/Fideliuss/Ex-Libris/releases).
