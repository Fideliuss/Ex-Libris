-- Ma Bibliothèque — champ Collection (ex: "Folio SF", "Champs" chez
-- Flammarion), distinct des tags thématiques et de l'éditeur lui-même.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column collection text;
