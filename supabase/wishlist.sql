-- Ma Bibliothèque — ajout du statut "wishlist"
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

alter table books drop constraint books_status_check;
alter table books add constraint books_status_check
  check (status in ('wishlist', 'to-read', 'reading', 'read'));
