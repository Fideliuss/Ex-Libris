-- Copie de supabase/schema.sql pour que `supabase start`/`supabase test db`
-- puisse reconstruire une base locale identique à la production. À tenir
-- synchronisé à la main avec schema.sql (même principe que les fichiers
-- incrémentaux du dossier supabase/ : pas d'automatisation, juste de la
-- rigueur à chaque migration).

create extension if not exists "pgcrypto";

-- Un profil par utilisateur : nom affiché + code ami unique. Créé
-- automatiquement à l'inscription par le trigger plus bas ; first_name et
-- last_name restent nullable pour un éventuel compte créé autrement.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  first_name text,
  last_name text,
  email text not null,
  friend_code text not null unique,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Demandes de partage entre deux comptes, échangées par code ami plutôt
-- que des UID codés en dur. status 'pending' tant que la cible n'a pas
-- accepté, 'accepted' une fois validé.
create table household_links (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  constraint household_links_no_self_link check (requester_id <> target_id)
);

alter table household_links enable row level security;

-- Une seule ligne par paire, peu importe qui a envoyé la demande.
create unique index household_links_pair_idx
  on household_links (least(requester_id, target_id), greatest(requester_id, target_id));

create policy "Users can view their own links"
  on household_links for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

create policy "Users can send link requests"
  on household_links for insert
  with check (auth.uid() = requester_id);

create policy "Target can accept a pending request"
  on household_links for update
  using (auth.uid() = target_id and status = 'pending')
  with check (status = 'accepted');

create policy "Either party can remove their link"
  on household_links for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Les deux parties d'un lien (en attente ou accepté) doivent pouvoir lire
-- le profil de l'autre pour afficher son nom. La sous-requête reste
-- filtrée par la policy select de household_links ci-dessus, donc ça ne
-- fuite rien de plus.
create policy "Users can view their own or linked profiles"
  on profiles for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from household_links
      where (requester_id = auth.uid() and target_id = profiles.user_id)
         or (target_id = auth.uid() and requester_id = profiles.user_id)
    )
  );

-- Résout un code ami en user_id sans exposer toute la table profiles :
-- security definer contourne la RLS pour cette seule recherche ciblée par
-- code exact.
create or replace function find_user_by_code(code text)
returns table (user_id uuid, display_name text)
language sql
security definer
set search_path = public
as $$
  select user_id, display_name from profiles where friend_code = code;
$$;

-- Postgres accorde EXECUTE à PUBLIC par défaut à la création d'une
-- fonction : sans ce revoke, n'importe qui pourrait résoudre un code ami
-- en {user_id, display_name} sans être connecté.
revoke execute on function find_user_by_code(text) from public;
grant execute on function find_user_by_code(text) to authenticated;

-- Crée le profil (nom + code ami) automatiquement à l'inscription, plutôt
-- que d'attendre la première visite de Compte -> Partage. Un trigger sur
-- auth.users plutôt qu'un appel client après signUp() : si la confirmation
-- par email est activée, il n'y a pas encore de session juste après
-- l'inscription, donc un insert RLS depuis le client échouerait.
create or replace function generate_friend_code()
returns text
language plpgsql
as $$
declare
  charset text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    select string_agg(substr(charset, (floor(random() * length(charset)))::int + 1, 1), '')
    into code
    from generate_series(1, 6);
    exit when not exists (select 1 from profiles where friend_code = code);
  end loop;
  return code;
end;
$$;

revoke execute on function generate_friend_code() from public;

-- raw_user_meta_data contient soit first_name/last_name (notre formulaire
-- d'inscription), soit given_name/family_name (fournis par Google en OAuth) ;
-- à défaut des deux, on retombe sur le préfixe de l'email pour ne jamais
-- laisser display_name vide.
create or replace function handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fname text := coalesce(
    nullif(trim(new.raw_user_meta_data->>'first_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'given_name'), ''),
    split_part(new.email, '@', 1)
  );
  lname text := coalesce(
    nullif(trim(new.raw_user_meta_data->>'last_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'family_name'), '')
  );
begin
  insert into profiles (user_id, display_name, first_name, last_name, email, friend_code)
  values (new.id, fname, fname, lname, new.email, generate_friend_code())
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user_profile();

create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  isbn text,
  title text not null,
  author text,
  translator text,
  illustrator text,
  publisher text,
  collection text,
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

-- Partage en lecture entre deux comptes liés (household_links, plus bas) :
-- chacun voit les livres de son partenaire, mais ne peut modifier/supprimer
-- que les siens. Tout utilisateur voit toujours ses propres livres, sinon
-- un compte solo sans partenaire ne verrait jamais ce qu'il vient d'ajouter.
create policy "Household members can view all household books"
  on books for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from household_links
      where status = 'accepted'
        and (
          (requester_id = auth.uid() and target_id = books.user_id)
          or (target_id = auth.uid() and requester_id = books.user_id)
        )
    )
  );

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

-- Objectif de lecture annuel, par utilisateur et par année (l'objectif peut
-- changer d'une année à l'autre). Même partage en lecture entre le foyer
-- que pour les livres.
create table reading_goals (
  user_id uuid not null references auth.users(id),
  year int not null,
  goal numeric not null,
  updated_at timestamptz default now(),
  primary key (user_id, year)
);

alter table reading_goals enable row level security;

create trigger reading_goals_set_updated_at
  before update on reading_goals
  for each row
  execute function set_updated_at();

create policy "Household members can view all household reading goals"
  on reading_goals for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from household_links
      where status = 'accepted'
        and (
          (requester_id = auth.uid() and target_id = reading_goals.user_id)
          or (target_id = auth.uid() and requester_id = reading_goals.user_id)
        )
    )
  );

create policy "Users can insert their own reading goals"
  on reading_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reading goals"
  on reading_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- RLS filtre les LIGNES, mais encore faut-il que anon/authenticated aient
-- le droit d'essayer l'opération en premier lieu (GRANT). Les projets
-- Supabase existants l'ont eu automatiquement (ancien comportement par
-- défaut, retiré le 2026-05-30) — un projet recréé de zéro aujourd'hui
-- via ce fichier ne l'a plus sans ce bloc explicite. Volontairement pas de
-- grant sur les fonctions ici : find_user_by_code/generate_friend_code ont
-- déjà leur propre grant ciblé plus haut, plus restrictif.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
