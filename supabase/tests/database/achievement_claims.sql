-- Vérifie la table achievement_claims (succès migrés depuis localStorage,
-- voir Achievements.jsx/AchievementsGallery.jsx) : chacun ne peut réclamer
-- que ses propres succès, mais un membre du foyer peut voir ceux des
-- autres (c'est tout l'intérêt de la migration) ; un tiers ne voit rien.
begin;
select plan(8);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'carol@test.local');

-- Alice et Bob dans le même foyer (le flux d'invitation complet est déjà
-- couvert par households.sql) ; Carol reste solo.
insert into households (id, owner_id) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001');

update profiles set household_id = '20000000-0000-0000-0000-000000000001'
  where user_id in ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

-- Se fait passer pour Alice.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  $$ insert into achievement_claims (user_id, badge_id, rank)
     values ('00000000-0000-0000-0000-000000000001', 'libri-lecti', 1) $$,
  'Alice peut réclamer son propre succès'
);

select throws_like(
  format(
    $$ insert into achievement_claims (user_id, badge_id, rank)
       values (%L, 'libri-lecti', 1) $$,
    '00000000-0000-0000-0000-000000000002'
  ),
  '%row-level security%',
  'Alice ne peut pas réclamer un succès au nom de Bob'
);

create temporary table test_alice_update_own as
with attempt as (
  update achievement_claims set rank = 2
  where user_id = '00000000-0000-0000-0000-000000000001' and badge_id = 'libri-lecti'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_alice_update_own),
  1,
  'Alice peut promouvoir (mettre à jour) son propre succès'
);

-- Bob réclame le sien (pour tester la visibilité croisée plus bas).
reset role;
insert into achievement_claims (user_id, badge_id, rank) values
  ('00000000-0000-0000-0000-000000000002', 'domus-communis', 0);

-- Alice ne peut pas modifier le succès de Bob malgré le partage en
-- lecture au sein du foyer.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

create temporary table test_alice_update_bob as
with attempt as (
  update achievement_claims set rank = 5
  where user_id = '00000000-0000-0000-0000-000000000002' and badge_id = 'domus-communis'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_alice_update_bob),
  0,
  'Alice ne peut pas modifier le succès de Bob'
);

select is(
  (select count(*)::int from achievement_claims where user_id = '00000000-0000-0000-0000-000000000002'),
  1,
  'Alice voit le succès de Bob (même foyer)'
);

-- Se fait passer pour Bob : vérifie le sens inverse.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select is(
  (select rank from achievement_claims
     where user_id = '00000000-0000-0000-0000-000000000001' and badge_id = 'libri-lecti'),
  2,
  'Bob voit le succès (et le rang à jour) d''Alice'
);

-- Se fait passer pour Carol : solo, aucun foyer commun.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from achievement_claims),
  0,
  'Carol (tierce partie, aucun foyer commun) ne voit aucun succès réclamé'
);

-- Contrôle négatif : la policy insert ne bloque que les autres, pas soi-même.
select lives_ok(
  $$ insert into achievement_claims (user_id, badge_id, rank)
     values ('00000000-0000-0000-0000-000000000003', 'libri-lecti', 3) $$,
  'Carol peut réclamer son propre succès (contrôle négatif)'
);

select * from finish();
rollback;
