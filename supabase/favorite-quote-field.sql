-- Ex Libris : champ Citation favorite, distinct des notes personnelles.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column if not exists favorite_quote text;
