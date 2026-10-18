-- Vérifie les actions du foyer qui n'étaient pas couvertes par households.sql :
-- les refus de invite_to_household, decline_household_invite,
-- cancel_household_invite (qui ne doivent agir que pour la bonne personne),
-- rename_household (fondateur seulement, nom nettoyé), remove_member côté
-- fondateur, et leave_household (membre simple, fondateur avec transfert de
-- propriété au plus petit user_id, dernier membre qui supprime le foyer).
begin;
select plan(33);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'carol@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'dave@test.local');

-- Codes amis capturés pendant qu'on est encore postgres (hors RLS), comme
-- dans households.sql et friend_code.sql.
create temporary table test_codes as
  select user_id, friend_code from profiles;
grant select on test_codes to authenticated;

-- Alice invite Bob et Carol : refus d'un code inconnu et de son propre code,
-- puis deux invitations qui créent le foyer à la volée.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select throws_like(
  $$ select invite_to_household('ZZZZZZ') $$,
  '%introuvable%',
  'Un code ami inconnu est refusé'
);

select throws_like(
  $$ select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000001')) $$,
  '%propre code%',
  'Alice ne peut pas utiliser son propre code ami'
);

select lives_ok(
  $$ select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000002')) $$,
  'Alice invite Bob'
);

select lives_ok(
  $$ select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000003')) $$,
  'Alice invite Carol (même foyer)'
);

-- Carol, simple invitée, ne peut pas annuler une invitation qu'elle n'a pas envoyée.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select cancel_household_invite((select id from household_invites where invitee_id = '00000000-0000-0000-0000-000000000003')) $$,
  'Carol (invitée) peut appeler cancel_household_invite sans erreur'
);

select is(
  (select count(*)::int from household_invites where invitee_id = '00000000-0000-0000-0000-000000000003'),
  1,
  'Mais l''invitation de Carol existe toujours : seul l''expéditeur peut l''annuler'
);

-- Dave, qui n'a aucun lien, ne peut pas refuser l'invitation de Bob à sa place.
-- (Bob connaît l'id de sa propre invitation ; on le lit ici avant de changer de rôle.)
reset role;
create temporary table test_bob_invite as
  select id from household_invites where invitee_id = '00000000-0000-0000-0000-000000000002';
grant select on test_bob_invite to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select decline_household_invite((select id from test_bob_invite)) $$,
  'Dave peut appeler decline_household_invite sur l''invitation de Bob sans erreur'
);

-- Bob la voit toujours, puis la refuse lui-même.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

select is(
  (select count(*)::int from household_invites where invitee_id = '00000000-0000-0000-0000-000000000002'),
  1,
  'L''invitation de Bob existe toujours : seul l''invité peut la refuser'
);

select lives_ok(
  $$ select decline_household_invite((select id from test_bob_invite)) $$,
  'Bob refuse son invitation'
);

select is(
  (select count(*)::int from household_invites where invitee_id = '00000000-0000-0000-0000-000000000002'),
  0,
  'L''invitation refusée a disparu'
);

select is(
  (select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000002'),
  null,
  'Bob n''est pas entré dans le foyer en refusant'
);

-- Carol accepte, Alice invite Dave.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select accept_household_invite((select id from household_invites where invitee_id = '00000000-0000-0000-0000-000000000003')) $$,
  'Carol accepte son invitation'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000004')) $$,
  'Alice invite Dave'
);

select throws_like(
  $$ select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000003')) $$,
  '%déjà%',
  'Alice ne peut pas réinviter Carol, déjà membre de son foyer'
);

reset role;
create temporary table test_dave_invite as
  select id from household_invites where invitee_id = '00000000-0000-0000-0000-000000000004';
grant select on test_dave_invite to authenticated;

-- Carol est membre mais n'a pas envoyé l'invitation de Dave : elle ne peut pas l'annuler.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select cancel_household_invite((select id from test_dave_invite)) $$,
  'Carol (membre, pas l''expéditrice) appelle cancel_household_invite sans erreur'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);

select is(
  (select count(*)::int from household_invites where invitee_id = '00000000-0000-0000-0000-000000000004'),
  1,
  'L''invitation de Dave existe toujours : seule Alice, qui l''a envoyée, peut l''annuler'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select cancel_household_invite((select id from test_dave_invite)) $$,
  'Alice annule l''invitation qu''elle a envoyée à Dave'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);

select is(
  (select count(*)::int from household_invites where invitee_id = '00000000-0000-0000-0000-000000000004'),
  0,
  'L''invitation annulée a disparu pour Dave'
);

-- Renommer le foyer : fondateur seulement, nom nettoyé, vide = pas de nom.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select rename_household('Piraté') $$,
  'Carol (membre simple) appelle rename_household sans erreur'
);

select is(
  (select name from households),
  null,
  'Mais le nom du foyer n''a pas changé : seule la fondatrice peut le renommer'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select lives_ok($$ select rename_household('  Chez nous  ') $$, 'Alice (fondatrice) renomme le foyer');

select is((select name from households), 'Chez nous', 'Le nom est enregistré sans espaces autour');

select lives_ok($$ select rename_household('   ') $$, 'Alice efface le nom du foyer');

select is((select name from households), null, 'Un nom vide devient "pas de nom"');

-- Remove_member côté fondateur : Alice retire Carol, mais pas elle-même.
select lives_ok(
  $$ select remove_member('00000000-0000-0000-0000-000000000003') $$,
  'Alice (fondatrice) retire Carol du foyer'
);

select is(
  (select count(*)::int from profiles where user_id = '00000000-0000-0000-0000-000000000003' and household_id is not null),
  0,
  'Carol n''est plus rattachée à un foyer'
);

select throws_like(
  $$ select remove_member('00000000-0000-0000-0000-000000000001') $$,
  '%Quitter%',
  'Alice ne peut pas se retirer elle-même par remove_member'
);

-- Quitter le foyer. Alice invite Bob et Dave, qui acceptent tous deux.
select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000002'));
select invite_to_household((select friend_code from test_codes where user_id = '00000000-0000-0000-0000-000000000004'));

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);
select accept_household_invite((select id from household_invites where invitee_id = '00000000-0000-0000-0000-000000000002'));

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);
select accept_household_invite((select id from household_invites where invitee_id = '00000000-0000-0000-0000-000000000004'));

-- Alice (fondatrice) part : la propriété passe au plus petit user_id restant (Bob).
reset role;
create temporary table test_household as select household_id as id from profiles where user_id = '00000000-0000-0000-0000-000000000001';
grant select on test_household to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select lives_ok($$ select leave_household() $$, 'Alice (fondatrice) quitte le foyer');

select is(
  (select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  null,
  'Alice n''est plus rattachée à un foyer'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

select is(
  (select owner_id from households where id = (select id from test_household)),
  '00000000-0000-0000-0000-000000000002'::uuid,
  'La propriété du foyer est passée à Bob, le plus petit user_id restant'
);

-- Bob part à son tour : la propriété passe à Dave, seul membre restant.
select leave_household();

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000004', 'role', 'authenticated')::text, true);

select is(
  (select owner_id from households where id = (select id from test_household)),
  '00000000-0000-0000-0000-000000000004'::uuid,
  'La propriété est passée à Dave quand Bob est parti'
);

-- Dave, dernier membre, part : le foyer est supprimé. Alice, sans foyer, peut
-- appeler leave_household sans erreur ni effet.
select leave_household();

reset role;
select is(
  (select count(*)::int from households where id = (select id from test_household)),
  0,
  'Le foyer est supprimé quand son dernier membre le quitte'
);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ select leave_household() $$,
  'Quitter alors qu''on n''a pas de foyer ne fait rien et ne lève pas d''erreur'
);

select * from finish();
rollback;
