-- Vérifie ce qui protège les données au quotidien et n'était pas couvert :
-- le profil créé automatiquement à l'inscription (nom, code ami), les
-- colonnes de profiles qu'un utilisateur a le droit de modifier, l'isolation
-- des livres et des objectifs de lecture face à un tiers, et le trigger
-- updated_at (qu'un client ne peut pas falsifier).
begin;
select plan(28);

create extension if not exists pgtap;

-- Trois inscriptions de formes différentes : notre formulaire (first_name,
-- last_name, avec des espaces), Google (given_name, family_name) et rien du
-- tout (repli sur le préfixe de l'email).
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local',
     '{"first_name": "  Alice  ", "last_name": "Martin"}'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local',
     '{"given_name": "Bruno", "family_name": "Durand"}'),
  ('00000000-0000-0000-0000-000000000003', 'carol.x@test.local', '{}');

-- Profil créé par le trigger d'inscription.
select is(
  (select display_name from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Alice',
  'Le prénom du formulaire est nettoyé (espaces retirés) et sert de nom affiché'
);

select is(
  (select last_name from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Martin',
  'Le nom de famille du formulaire est conservé'
);

select is(
  (select display_name || ' ' || last_name from profiles where user_id = '00000000-0000-0000-0000-000000000002'),
  'Bruno Durand',
  'Un compte Google (given_name, family_name) donne le même résultat'
);

select is(
  (select display_name from profiles where user_id = '00000000-0000-0000-0000-000000000003'),
  'carol.x',
  'Sans nom fourni, le nom affiché est le préfixe de l''email'
);

select is(
  (select last_name from profiles where user_id = '00000000-0000-0000-0000-000000000003'),
  null,
  'Sans nom de famille fourni, il reste vide'
);

select is(
  (select count(*)::int from profiles where friend_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  3,
  'Chaque code ami a 6 caractères, sans les lettres ambiguës (I, L, O) ni les chiffres 0 et 1'
);

select is(
  (select count(distinct friend_code)::int from profiles),
  3,
  'Les codes amis sont tous différents'
);

-- Colonnes de profiles modifiables par l'utilisateur : le nom, oui ; l'identité
-- (email, code ami, user_id) et le foyer, non.
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ update profiles set display_name = 'Alicia', has_seen_tutorial = true
       where user_id = '00000000-0000-0000-0000-000000000001' $$,
  'Alice peut modifier son nom affiché et son état de tutoriel'
);

select is(
  (select display_name from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Alicia',
  'La modification du nom est enregistrée'
);

select throws_like(
  $$ update profiles set friend_code = 'AAAAAA' where user_id = '00000000-0000-0000-0000-000000000001' $$,
  '%permission denied%',
  'Alice ne peut pas choisir son code ami'
);

select throws_like(
  $$ update profiles set email = 'autre@test.local' where user_id = '00000000-0000-0000-0000-000000000001' $$,
  '%permission denied%',
  'Alice ne peut pas modifier l''email de son profil'
);

select throws_like(
  $$ update profiles set user_id = '00000000-0000-0000-0000-0000000000ff' where user_id = '00000000-0000-0000-0000-000000000001' $$,
  '%permission denied%',
  'Alice ne peut pas changer l''identifiant de son profil'
);

create temporary table test_alice_edits_bob as
with attempt as (
  update profiles set display_name = 'piraté'
  where user_id = '00000000-0000-0000-0000-000000000002'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_alice_edits_bob),
  0,
  'Alice ne peut pas modifier le profil de Bob'
);

-- Livres : un tiers ne peut ni en créer au nom d'Alice, ni modifier ou
-- supprimer les siens.
reset role;
insert into books (id, user_id, title, updated_at) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Livre d''Alice', '2020-01-01 00:00:00+00');

-- Un objectif daté de 2020 : sans cela, insertion et modification auraient la
-- même date (la transaction est unique) et on ne verrait pas le trigger agir.
insert into reading_goals (user_id, year, goal, updated_at) values
  ('00000000-0000-0000-0000-000000000001', 2026, 20, '2020-01-01 00:00:00+00');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

select throws_like(
  $$ insert into books (user_id, title) values ('00000000-0000-0000-0000-000000000001', 'Faux') $$,
  '%row-level security%',
  'Carol ne peut pas créer un livre au nom d''Alice'
);

select lives_ok(
  $$ insert into books (user_id, title) values ('00000000-0000-0000-0000-000000000003', 'Livre de Carol') $$,
  'Carol peut créer un livre à son propre nom'
);

create temporary table test_carol_update_alice as
with attempt as (
  update books set title = 'piraté' where id = '10000000-0000-0000-0000-000000000001'
  returning 1
)
select count(*)::int as n from attempt;

select is((select n from test_carol_update_alice), 0, 'Carol ne peut pas modifier le livre d''Alice');

create temporary table test_carol_delete_alice as
with attempt as (
  delete from books where id = '10000000-0000-0000-0000-000000000001'
  returning 1
)
select count(*)::int as n from attempt;

select is((select n from test_carol_delete_alice), 0, 'Carol ne peut pas supprimer le livre d''Alice');

-- Un livre ne peut pas être "donné" à quelqu'un d'autre par une modification.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select throws_like(
  $$ update books set user_id = '00000000-0000-0000-0000-000000000003'
       where id = '10000000-0000-0000-0000-000000000001' $$,
  '%row-level security%',
  'Alice ne peut pas transférer son livre à Carol en changeant son user_id'
);

-- Trigger updated_at : posé par la base à chaque modification, quoi que le
-- client envoie.
select lives_ok(
  $$ update books set title = 'Titre modifié' where id = '10000000-0000-0000-0000-000000000001' $$,
  'Alice modifie son livre'
);

select ok(
  (select updated_at = now() from books where id = '10000000-0000-0000-0000-000000000001'),
  'updated_at est repassé à la date de la modification (il valait 2020)'
);

select lives_ok(
  $$ update books set title = 'Encore', updated_at = '2000-01-01 00:00:00+00'
       where id = '10000000-0000-0000-0000-000000000001' $$,
  'Alice tente de falsifier updated_at'
);

select ok(
  (select updated_at = now() from books where id = '10000000-0000-0000-0000-000000000001'),
  'La date envoyée par le client est ignorée : updated_at vaut toujours maintenant'
);

-- Objectifs de lecture : propriétaire seulement, jamais supprimables.
select lives_ok(
  $$ insert into reading_goals (user_id, year, goal) values ('00000000-0000-0000-0000-000000000001', 2028, 15) $$,
  'Alice crée un objectif de lecture à son nom'
);

select throws_like(
  $$ insert into reading_goals (user_id, year, goal) values ('00000000-0000-0000-0000-000000000001', 2027, 5)
     , ('00000000-0000-0000-0000-000000000003', 2027, 5) $$,
  '%row-level security%',
  'Alice ne peut pas créer un objectif au nom de Carol (même dans un lot avec le sien)'
);

select lives_ok(
  $$ update reading_goals set goal = 30 where user_id = '00000000-0000-0000-0000-000000000001' and year = 2026 $$,
  'Alice modifie son objectif'
);

select ok(
  (select updated_at = now() from reading_goals where user_id = '00000000-0000-0000-0000-000000000001' and year = 2026),
  'Le trigger updated_at s''applique aussi aux objectifs de lecture (il valait 2020)'
);

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text, true);

create temporary table test_carol_goal_attempts as
with changed as (
  update reading_goals set goal = 1 where user_id = '00000000-0000-0000-0000-000000000001'
  returning 1
)
select count(*)::int as n from changed;

select is((select n from test_carol_goal_attempts), 0, 'Carol ne peut pas modifier l''objectif d''Alice');

select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

create temporary table test_alice_goal_delete as
with removed as (
  delete from reading_goals where user_id = '00000000-0000-0000-0000-000000000001'
  returning 1
)
select count(*)::int as n from removed;

select is(
  (select n from test_alice_goal_delete),
  0,
  'Même Alice ne peut pas supprimer son objectif : aucune règle de suppression n''existe'
);

select * from finish();
rollback;
