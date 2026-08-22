-- Ma Bibliothèque — objectif de lecture par année (remplace user_settings).
-- Partage en lecture entre les deux comptes du foyer (comme pour les
-- livres), mais chacun ne peut modifier que ses propres objectifs.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

create table reading_goals (
  user_id uuid not null references auth.users(id),
  year int not null,
  goal numeric not null,
  updated_at timestamptz default now(),
  primary key (user_id, year)
);

alter table reading_goals enable row level security;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reading_goals_set_updated_at
  before update on reading_goals
  for each row
  execute function set_updated_at();

create policy "Household members can view all household reading goals"
  on reading_goals for select
  using (auth.uid() in (
    '62c4fc66-007a-4018-bbf1-42c0990284c0',
    '3d041fdc-b619-46a4-8fed-743cce2269f6'
  ));

create policy "Users can insert their own reading goals"
  on reading_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reading goals"
  on reading_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reprend l'objectif déjà configuré cette année (table user_settings) pour
-- ne pas perdre la valeur que tu viens de tester.
insert into reading_goals (user_id, year, goal)
select user_id, extract(year from now())::int, annual_goal
from user_settings
on conflict (user_id, year) do nothing;

drop table user_settings;
