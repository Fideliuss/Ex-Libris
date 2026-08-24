-- Ex Libris — système de code ami : remplace le partage de foyer codé en
-- dur (deux UID fixes) par un partage basé sur des codes que n'importe
-- quels deux comptes peuvent échanger. Le modèle reste un binôme (une
-- seule paire active à la fois côté client), mais la base ne connaît plus
-- Brayan/Bradley par avance.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

-- Un profil par utilisateur : nom affiché + code ami unique, créés à la
-- première visite de la page Compte (pas au moment de l'inscription, pour
-- ne pas complexifier le flux de création de compte).
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
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

-- Demandes de partage entre deux comptes. status 'pending' tant que la
-- cible n'a pas accepté, 'accepted' une fois validé.
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
-- le profil de l'autre pour afficher son nom. La sous-requête sur
-- household_links reste filtrée par SA PROPRE policy select ci-dessus
-- (auth.uid() = requester_id/target_id), donc ça ne fuite rien de plus.
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

-- Résout un code ami en user_id sans exposer toute la table profiles (la
-- policy select ci-dessus ne permet de lire que son propre profil ou celui
-- d'un lien déjà existant) : security definer contourne la RLS pour cette
-- seule recherche ciblée par code exact.
create or replace function find_user_by_code(code text)
returns table (user_id uuid, display_name text)
language sql
security definer
set search_path = public
as $$
  select user_id, display_name from profiles where friend_code = code;
$$;

grant execute on function find_user_by_code(text) to authenticated;

-- Remplace le partage codé en dur par le partage basé sur household_links.
drop policy "Household members can view all household books" on books;
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

drop policy "Household members can view all household reading goals" on reading_goals;
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

-- Seed : reprend le lien Brayan <-> Bradley qui existait en dur, pour ne
-- pas casser leur partage pendant le déploiement de cette migration.
insert into profiles (user_id, display_name, email, friend_code)
select '62c4fc66-007a-4018-bbf1-42c0990284c0', 'Brayan', email, 'BRAYAN1'
from auth.users where id = '62c4fc66-007a-4018-bbf1-42c0990284c0'
on conflict (user_id) do nothing;

insert into profiles (user_id, display_name, email, friend_code)
select '3d041fdc-b619-46a4-8fed-743cce2269f6', 'Bradley', email, 'BRADLEY1'
from auth.users where id = '3d041fdc-b619-46a4-8fed-743cce2269f6'
on conflict (user_id) do nothing;

insert into household_links (requester_id, target_id, status)
select '62c4fc66-007a-4018-bbf1-42c0990284c0', '3d041fdc-b619-46a4-8fed-743cce2269f6', 'accepted'
where not exists (
  select 1 from household_links
  where (requester_id = '62c4fc66-007a-4018-bbf1-42c0990284c0' and target_id = '3d041fdc-b619-46a4-8fed-743cce2269f6')
     or (requester_id = '3d041fdc-b619-46a4-8fed-743cce2269f6' and target_id = '62c4fc66-007a-4018-bbf1-42c0990284c0')
);
