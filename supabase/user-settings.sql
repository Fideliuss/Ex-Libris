-- Ma Bibliothèque — réglages par utilisateur (objectif de lecture annuel).
-- Partage en lecture entre les deux comptes du foyer (comme pour les livres),
-- mais chacun ne peut modifier que le sien.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

create table user_settings (
  user_id uuid primary key references auth.users(id),
  annual_goal numeric not null default 12,
  updated_at timestamptz default now()
);

alter table user_settings enable row level security;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_settings_set_updated_at
  before update on user_settings
  for each row
  execute function set_updated_at();

create policy "Household members can view all household settings"
  on user_settings for select
  using (auth.uid() in (
    '62c4fc66-007a-4018-bbf1-42c0990284c0',
    '3d041fdc-b619-46a4-8fed-743cce2269f6'
  ));

create policy "Users can insert their own settings"
  on user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
