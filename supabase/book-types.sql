-- Ma Bibliothèque — différenciation Livre / BD / Comics / Manga
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column type text not null default 'book'
  check (type in ('book', 'bd', 'comics', 'manga'));

-- Univers/équipe (ex: Avengers, X-Men) — pertinent surtout pour les comics,
-- où un personnage traverse plusieurs séries différentes.
alter table books add column universe text;
