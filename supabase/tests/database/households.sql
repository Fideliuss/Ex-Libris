-- Vérifie le nouveau modèle "foyer" (households/household_invites/
-- profiles.household_id) : invitation, acceptation, isolation vis-à-vis
-- des tiers, et la faille qu'aurait ouverte household_id sans le revoke
-- de colonne (voir baseline.sql).
begin;
select plan(15);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'carol@test.local');

insert into books (id, user_id, title) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Livre d''Alice');

-- Le trigger on_auth_user_created crée déjà profiles (avec un friend_code
-- généré aléatoirement) pour les trois : capture le code de Bob pendant
-- qu'on est encore postgres, hors RLS, comme dans friend_code.sql.
create temporary table test_bob_code as
  select friend_code from profiles where user_id = '00000000-0000-0000-0000-000000000002';
grant select on test_bob_code to authenticated;

-- Se fait passer pour Alice.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  format(
    $$ select invite_to_household(%L) $$,
    lower((select friend_code from test_bob_code))
  ),
  'Alice peut inviter Bob via son code ami (insensible à la casse)'
);

select isnt(
  (select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  null,
  'Le foyer d''Alice a été créé à la volée'
);

select is(
  (select owner_id from households
     where id = (select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000001')),
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Alice est fondatrice du foyer qu''elle vient de créer'
);

select throws_like(
  format(
    $$ select invite_to_household(%L) $$,
    lower((select friend_code from test_bob_code))
  ),
  '%déjà%',
  'Une deuxième invitation à Bob est rejetée (déjà en attente, contrainte unique)'
);

-- Capture pendant qu'on est encore postgres : la RLS de profiles
-- n'autoriserait pas Carol à lire le household_id d'Alice plus bas, ce qui
-- fausserait le test suivant (elle doit échouer sur le revoke de colonne,
-- pas sur le fait de ne pas connaître la valeur à écrire).
reset role;
create temporary table test_alice_household as
  select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000001';
grant select on test_alice_household to authenticated;

-- Bob voit l'invitation qui lui est adressée ; Carol non.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from household_invites where invitee_id = '00000000-0000-0000-0000-000000000002'),
  1,
  'Bob voit l''invitation qui lui est adressée'
);

select ok(
  exists(select 1 from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Bob (invité, pas encore membre) peut voir le profil d''Alice qui l''a invité'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from household_invites),
  0,
  'Carol (tierce partie) ne voit aucune invitation du foyer d''Alice'
);

select ok(
  not exists(select 1 from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Carol (tierce partie, aucune invitation) ne voit PAS le profil d''Alice'
);

-- La faille que le revoke de colonne doit bloquer : Carol ne peut pas
-- s'auto-assigner le foyer d'Alice pour hériter de la visibilité de ses
-- livres, sans jamais passer par une invitation.
select throws_like(
  format(
    $$ update profiles set household_id = %L where user_id = '00000000-0000-0000-0000-000000000003' $$,
    (select household_id from test_alice_household)
  ),
  '%permission denied%',
  'Carol ne peut pas s''auto-assigner un household_id par update direct (colonne revoked)'
);

-- Bob accepte.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  $$ select accept_household_invite(
       (select id from household_invites
          where invitee_id = '00000000-0000-0000-0000-000000000002' limit 1)
     ) $$,
  'Bob peut accepter l''invitation'
);

select is(
  (select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000002'),
  (select household_id from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Bob rejoint bien le foyer d''Alice après acceptation'
);

select is(
  (select count(*)::int from household_invites),
  0,
  'L''invitation a disparu une fois acceptée'
);

-- La faille corrigée par ce correctif : sans la policy books basée sur
-- is_household_member(), Bob ne verrait jamais le livre d'Alice malgré
-- leur foyer commun, car il n'existe aucune ligne household_links (ancien
-- modèle) pour cette paire.
select is(
  (select count(*)::int from books where id = '10000000-0000-0000-0000-000000000001'),
  1,
  'Bob voit le livre d''Alice une fois membre de son foyer'
);

select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from books where id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Carol (tierce partie, aucun foyer commun) ne voit PAS le livre d''Alice'
);

-- Seul le fondateur peut retirer un membre (repasse en Bob, laissé sur
-- Carol par le check précédent).
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select throws_like(
  $$ select remove_member('00000000-0000-0000-0000-000000000001') $$,
  '%fondateur%',
  'Bob (simple membre) ne peut pas retirer Alice (fondatrice)'
);

select * from finish();
rollback;
