-- Ex Libris : indicateur "tutoriel déjà vu", pour ne montrer le modal
-- d'onboarding qu'à la première connexion (ou à la demande, depuis
-- Mon compte -> Sécurité -> Revoir le tutoriel).
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table profiles add column has_seen_tutorial boolean not null default false;
