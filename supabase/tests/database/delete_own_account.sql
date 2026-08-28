-- Vérifie la suppression de compte en libre-service : on ne peut supprimer
-- que soi-même, jamais sans être connecté, et la cascade nettoie bien
-- livres/objectifs/profil sans toucher aux comptes tiers liés.
begin;
select plan(7);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local');

insert into household_links (requester_id, target_id, status) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted');

insert into books (id, user_id, title) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Livre d''Alice');

insert into reading_goals (user_id, year, goal) values
  ('00000000-0000-0000-0000-000000000001', 2026, 20);

-- Régression : pas d'appel possible sans être connecté.
set local role anon;
select throws_ok(
  $$ select delete_own_account() $$,
  '42501',
  null::text,
  'delete_own_account est refusée pour un appelant anonyme'
);

-- Alice supprime son propre compte.
reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  $$ select delete_own_account() $$,
  'Alice peut supprimer son propre compte'
);

-- Vérifications côté postgres (bypass RLS) : tout ce qui appartenait à
-- Alice a disparu, mais Bob (tiers lié) reste intact.
reset role;

select is(
  (select count(*)::int from auth.users where id = '00000000-0000-0000-0000-000000000001'),
  0,
  'Le compte auth.users d''Alice est bien supprimé'
);

select is(
  (select count(*)::int from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  0,
  'Le profil d''Alice est supprimé (cascade)'
);

select is(
  (select count(*)::int from books where user_id = '00000000-0000-0000-0000-000000000001'),
  0,
  'Les livres d''Alice sont supprimés (cascade)'
);

select is(
  (select count(*)::int from reading_goals where user_id = '00000000-0000-0000-0000-000000000001'),
  0,
  'Les objectifs de lecture d''Alice sont supprimés (cascade)'
);

select ok(
  exists(select 1 from auth.users where id = '00000000-0000-0000-0000-000000000002'),
  'Le compte de Bob (tiers lié) n''est pas affecté par la suppression du compte d''Alice'
);

select * from finish();
rollback;
