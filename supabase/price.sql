-- Ma Bibliothèque — ajout du prix et de la date d'achat
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column price numeric(10, 2);
alter table books add column purchase_date date;
