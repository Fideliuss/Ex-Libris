-- Ma Bibliothèque — traducteur et dessinateur, distincts de l'auteur
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column translator text;
alter table books add column illustrator text;
