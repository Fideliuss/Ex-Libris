-- Ma Bibliothèque — ajout de la série et du numéro de tome
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column series text;
alter table books add column series_index numeric;
