-- Ma Bibliothèque — ajout du résumé/synopsis du livre
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column description text;
