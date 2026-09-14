-- Ex Libris — schéma complet (état actuel)
--
-- Fichier consolidé : reflète l'état actuel complet de la base, pas
-- l'historique des ajouts successifs. Deux usages :
-- 1. C'est ce fichier que `supabase start`/`supabase test db` appliquent
--    pour reconstruire une base locale identique à la production —
--    aucune autre copie à tenir synchronisée.
-- 2. À utiliser aussi pour reconstruire la vraie base depuis zéro
--    (Supabase Dashboard -> SQL Editor -> New query) si besoin un jour.

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
  has_seen_tutorial boolean not null default false,
  last_seen_changelog text,
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
-- fonction, ET Supabase accorde en plus directement ce droit à anon/
-- authenticated/service_role via ses propres "default privileges" — un
-- simple `revoke ... from public` ne suffit donc pas, il faut retirer
-- explicitement le droit direct d'anon (déjà vérifié en base : anon avait
-- toujours EXECUTE après le seul revoke de public).
revoke execute on function find_user_by_code(text) from public, anon, authenticated, service_role;
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

-- Même remarque que pour find_user_by_code : il faut retirer le droit
-- direct d'anon/authenticated/service_role, pas juste celui de public.
-- Le trigger plus bas peut quand même l'appeler : il tourne en security
-- definer, donc en tant que postgres (propriétaire), sans avoir besoin
-- d'un grant explicite sur ses propres fonctions.
revoke execute on function generate_friend_code() from public, anon, authenticated, service_role;

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

-- Modèle "foyer" (households) : remplace progressivement household_links
-- (paires 1:1) par un vrai groupe à N membres. Migration délibérément
-- additive pour l'instant : household_links reste en place et fonctionnel,
-- rien ici ne change le comportement actuel. La bascule (peuplement de
-- households/profiles.household_id depuis les paires acceptées, RLS de
-- books/reading_goals sur household_id, puis suppression de
-- household_links) se fera dans une migration séparée, au moment où le
-- code applicatif sera prêt à l'utiliser.
--
-- Pas de colonne de limite de membres pour l'instant (pas de pricing réel
-- à faire respecter encore) ; elle s'ajoutera plus tard sans rien casser.
create table households (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Un utilisateur appartient à au plus un foyer à la fois (comme un plan
-- Spotify Family) : une simple colonne nullable sur profiles suffit, pas
-- besoin d'une table de jointure household_members. Ajoutée avant la RLS
-- de households ci-dessous, qui s'appuie dessus.
alter table profiles add column household_id uuid references households(id) on delete set null;

create index profiles_household_id_idx on profiles(household_id);

-- Le revoke qui protège cette colonne est plus bas, après le grant all on
-- all tables (sinon ce grant, plus permissif et exécuté après dans ce
-- fichier, l'annulerait silencieusement).

alter table households enable row level security;

create policy "Members can view their own household"
  on households for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
        and profiles.household_id = households.id
    )
  );

-- Pas de policy insert/update/delete côté client : toute mutation passe
-- par les fonctions security definer plus bas, qui appliquent les règles
-- (un seul foyer par utilisateur, transfert de propriété, etc.) au même
-- endroit plutôt que de les éparpiller dans des policies RLS complexes.

-- Une policy sur profiles ne peut pas se référencer elle-même directement
-- (une sous-requête "select ... from profiles" dans une policy de
-- profiles fait planter Postgres avec "infinite recursion detected in
-- policy" dès qu'on touche la table, même pour une condition simple) :
-- même contournement que find_user_by_code plus haut, une fonction
-- security definer qui lit profiles hors RLS.
create or replace function is_household_member(other_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles me
    join profiles other on other.household_id = me.household_id
    where me.user_id = auth.uid()
      and me.household_id is not null
      and other.user_id = other_user_id
  );
$$;

revoke execute on function is_household_member(uuid) from public, anon, service_role;
grant execute on function is_household_member(uuid) to authenticated;

-- La policy "Users can view their own or linked profiles" plus haut ne
-- connaît que household_links (l'ancien modèle) : sans celle-ci, deux
-- membres d'un même foyer ne pourraient pas voir le nom l'un de l'autre
-- (nécessaire pour l'UI de partage). Plusieurs policies permissives pour
-- la même commande se combinent en OR, donc celle-ci s'ajoute simplement
-- à l'existante plutôt que de la remplacer.
create policy "Household members can view each other's profiles"
  on profiles for select
  using (is_household_member(user_id));

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (household_id, invitee_id)
);

alter table household_invites enable row level security;

create index household_invites_invitee_idx on household_invites(invitee_id);
create index household_invites_household_id_idx on household_invites(household_id);

create policy "Invitee and household members can view relevant invites"
  on household_invites for select
  using (
    invitee_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
        and profiles.household_id = household_invites.household_id
    )
  );

-- Même logique que households : écriture uniquement via les fonctions
-- ci-dessous.

-- Invite quelqu'un dans son foyer via son code ami. Crée le foyer de
-- l'appelant à la volée s'il n'en a pas encore (il en devient le
-- fondateur) : pas de bouton "créer un foyer" séparé dans l'UI prévue.
create or replace function invite_to_household(code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  target uuid;
  hh_id uuid;
begin
  select user_id into target from profiles where friend_code = upper(trim(code));
  if target is null then
    raise exception 'Code ami introuvable.';
  end if;
  if target = caller then
    raise exception 'Tu ne peux pas utiliser ton propre code.';
  end if;

  select household_id into hh_id from profiles where user_id = caller;
  if hh_id is null then
    insert into households (owner_id) values (caller) returning id into hh_id;
    update profiles set household_id = hh_id where user_id = caller;
  end if;

  if exists (
    select 1 from profiles where user_id = target and household_id = hh_id
  ) then
    raise exception 'Cette personne fait déjà partie de ton foyer.';
  end if;

  begin
    insert into household_invites (household_id, invited_by, invitee_id)
    values (hh_id, caller, target);
  exception when unique_violation then
    raise exception 'Une invitation est déjà en attente pour cette personne.';
  end;
end;
$$;

revoke execute on function invite_to_household(text) from public, anon, service_role;
grant execute on function invite_to_household(text) to authenticated;

create or replace function accept_household_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  hh_id uuid;
begin
  delete from household_invites
  where id = invite_id and invitee_id = auth.uid()
  returning household_id into hh_id;

  if hh_id is null then
    raise exception 'Invitation introuvable.';
  end if;

  update profiles set household_id = hh_id where user_id = auth.uid();
end;
$$;

revoke execute on function accept_household_invite(uuid) from public, anon, service_role;
grant execute on function accept_household_invite(uuid) to authenticated;

create or replace function decline_household_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from household_invites
  where id = invite_id and invitee_id = auth.uid();
end;
$$;

revoke execute on function decline_household_invite(uuid) from public, anon, service_role;
grant execute on function decline_household_invite(uuid) to authenticated;

create or replace function cancel_household_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from household_invites
  where id = invite_id and invited_by = auth.uid();
end;
$$;

revoke execute on function cancel_household_invite(uuid) from public, anon, service_role;
grant execute on function cancel_household_invite(uuid) to authenticated;

-- Si le fondateur part et qu'il reste des membres, la propriété est
-- transférée à l'un d'eux (choix arbitraire mais déterministe : le plus
-- petit user_id) plutôt que de laisser le foyer sans propriétaire. Assez
-- bon pour l'instant ; à revisiter si la propriété porte un jour une
-- vraie notion de facturation.
create or replace function leave_household()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  hh_id uuid;
  was_owner boolean;
  next_owner uuid;
  remaining_count int;
begin
  select household_id into hh_id from profiles where user_id = caller;
  if hh_id is null then
    return;
  end if;

  select (owner_id = caller) into was_owner from households where id = hh_id;

  update profiles set household_id = null where user_id = caller;

  select count(*) into remaining_count from profiles where household_id = hh_id;

  if remaining_count = 0 then
    delete from households where id = hh_id;
  elsif was_owner then
    select user_id into next_owner
    from profiles
    where household_id = hh_id
    order by user_id
    limit 1;
    update households set owner_id = next_owner where id = hh_id;
  end if;
end;
$$;

revoke execute on function leave_household() from public, anon, service_role;
grant execute on function leave_household() to authenticated;

create or replace function remove_member(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
  hh_id uuid;
begin
  select household_id into hh_id from profiles where user_id = caller;
  if hh_id is null or not exists (
    select 1 from households where id = hh_id and owner_id = caller
  ) then
    raise exception 'Seul le fondateur du foyer peut retirer un membre.';
  end if;
  if target_user_id = caller then
    raise exception 'Utilise "Quitter le foyer" pour te retirer toi-même.';
  end if;

  update profiles
  set household_id = null
  where user_id = target_user_id and household_id = hh_id;
end;
$$;

revoke execute on function remove_member(uuid) from public, anon, service_role;
grant execute on function remove_member(uuid) to authenticated;

create or replace function rename_household(new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update households
  set name = nullif(trim(new_name), '')
  where id = (select household_id from profiles where user_id = auth.uid())
    and owner_id = auth.uid();
end;
$$;

revoke execute on function rename_household(text) from public, anon, service_role;
grant execute on function rename_household(text) to authenticated;

create table books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  isbn text,
  title text not null,
  author text[],
  translator text[],
  illustrator text[],
  publisher text,
  collection text,
  edition text[],
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
  favorite_quote text,
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
  user_id uuid not null references auth.users(id) on delete cascade,
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

-- Un revoke ciblé sur une seule colonne (`revoke update (household_id)
-- ...`) ne suffit PAS ici : un privilège table-level (comme le grant all
-- ci-dessus) et un privilège column-level ne se soustraient pas, ils
-- s'additionnent (vérifié empiriquement, pas juste supposé) — le
-- table-level continue de tout autoriser quoi que dise le revoke sur une
-- colonne précise. Pour restreindre réellement household_id il faut
-- retirer le privilège UPDATE table-level et le regranter explicitement
-- colonne par colonne, sur exactement celles que le client met à jour
-- aujourd'hui (voir updateMyProfile/markTutorialSeen/markChangelogSeen
-- dans src/lib/friendCode.js). Sans ça, n'importe quel compte pourrait
-- s'auto-assigner le household_id d'un foyer étranger et hériter de la
-- visibilité de ses livres, sans jamais passer par une invitation.
-- Seules les fonctions security definer du modèle foyer (qui tournent
-- avec les privilèges du propriétaire de la table, donc contournent ce
-- revoke) peuvent modifier household_id.
revoke update on profiles from authenticated;
grant update (display_name, first_name, last_name, has_seen_tutorial, last_seen_changelog)
  on profiles to authenticated;

-- Suppression de compte en libre-service (droit à l'effacement). security
-- definer : auth.users n'est pas modifiable par le rôle authenticated
-- normalement. `where id = auth.uid()` garantit qu'on ne peut jamais
-- supprimer que son propre compte, malgré ce contournement de RLS.
-- profiles/household_links/books/reading_goals sont tous en
-- `on delete cascade` vers auth.users, donc leur nettoyage est automatique
-- une fois la ligne auth.users supprimée — seuls les fichiers de
-- couverture dans le storage n'ont pas de contrainte FK et doivent être
-- supprimés côté client avant d'appeler cette fonction.
create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function delete_own_account() from public, anon, service_role;
grant execute on function delete_own_account() to authenticated;
