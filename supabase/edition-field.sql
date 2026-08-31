-- Ex Libris : champ Édition (ex: "Poche", "Grand format", "Illustrée",
-- "Collector"), distinct de l'éditeur et de la collection éditoriale.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books add column edition text;
