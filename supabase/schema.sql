-- Ma Bibliothèque — schéma complet (état actuel)
--
-- Fichier consolidé : reflète l'état actuel complet de la base, pas
-- l'historique des ajouts successifs. À utiliser pour reconstruire la base
-- depuis zéro (Supabase Dashboard -> SQL Editor -> New query). Les anciens
-- fichiers incrémentaux (price.sql, wishlist.sql, description.sql,
-- series.sql, household-sharing.sql) ont été fusionnés ici et supprimés.

create extension if not exists "pgcrypto";

create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  isbn text,
  title text not null,
  author text,
  translator text,
  illustrator text,
  publisher text,
  description text,
  series text,
  series_index numeric,
  type text not null default 'book'
    check (type in ('book', 'bd', 'comics', 'manga')),
  universe text,
  tags text[] default '{}',
  status text not null default 'to-read'
    check (status in ('wishlist', 'to-read', 'reading', 'read')),
  date_started date,
  date_finished date,
  rating int check (rating between 0 and 5),
  notes text,
  page_count int,
  cover_url text,
  price numeric(10, 2),
  purchase_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table books enable row level security;

create index books_user_id_idx on books(user_id);
create index books_tags_idx on books using gin(tags);

-- Met à jour updated_at automatiquement à chaque modification d'une ligne
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_set_updated_at
  before update on books
  for each row
  execute function set_updated_at();

-- Partage en lecture entre les deux comptes du foyer : chacun voit les
-- livres de l'autre, mais ne peut modifier/supprimer que les siens.
create policy "Household members can view all household books"
  on books for select
  using (auth.uid() in (
    '62c4fc66-007a-4018-bbf1-42c0990284c0',
    '3d041fdc-b619-46a4-8fed-743cce2269f6'
  ));

create policy "Users can insert their own books"
  on books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own books"
  on books for delete
  using (auth.uid() = user_id);

-- Stockage des couvertures importées manuellement
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

create policy "Public read access to covers"
on storage.objects for select
using (bucket_id = 'covers');

-- Chaque utilisateur ne peut déposer/modifier/supprimer que des fichiers
-- dans son propre dossier : covers/<user_id>/...
create policy "Users can upload their own covers"
on storage.objects for insert
with check (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own covers"
on storage.objects for update
using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own covers"
on storage.objects for delete
using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);
