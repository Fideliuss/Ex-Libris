-- Ma Bibliothèque — schéma initial
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

create extension if not exists "pgcrypto";

create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  isbn text,
  title text not null,
  author text,
  publisher text,
  tags text[] default '{}',
  status text not null default 'to-read' check (status in ('to-read', 'reading', 'read')),
  date_started date,
  date_finished date,
  rating int check (rating between 0 and 5),
  notes text,
  page_count int,
  cover_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table books enable row level security;

create policy "Users can manage their own books"
  on books
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
