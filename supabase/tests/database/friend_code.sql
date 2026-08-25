-- Vérifie la visibilité des profils et l'accès à find_user_by_code — en
-- particulier la régression trouvée en prod : la fonction était appelable
-- sans être connecté (grant EXECUTE à PUBLIC par défaut à la création).
begin;
select plan(6);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'carol@test.local');

-- Bob a envoyé une demande à Alice, pas encore acceptée.
insert into household_links (requester_id, target_id, status) values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'pending');

-- Capturé pendant qu'on est encore postgres (donc hors RLS) : une table
-- temporaire n'est pas soumise à la RLS de `profiles`, contrairement à une
-- sous-requête qu'on referait plus bas depuis le contexte d'Alice.
create temporary table test_carol_code as
  select friend_code from profiles where user_id = '00000000-0000-0000-0000-000000000003';
-- Créée en tant que postgres : sans ce grant, authenticated/anon (le rôle
-- change plus bas, pas juste la revendication JWT) n'y aurait pas accès.
grant select on test_carol_code to authenticated, anon;

-- Se fait passer pour Alice.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select ok(
  exists(select 1 from profiles where user_id = '00000000-0000-0000-0000-000000000001'),
  'Alice voit son propre profil'
);

select ok(
  not exists(select 1 from profiles where user_id = '00000000-0000-0000-0000-000000000003'),
  'Alice ne voit PAS le profil de Carol (aucun lien)'
);

select ok(
  exists(select 1 from profiles where user_id = '00000000-0000-0000-0000-000000000002'),
  'Alice voit le profil de Bob même si le lien est encore "pending" (pour afficher qui a envoyé la demande)'
);

select is(
  (select count(*)::int from find_user_by_code((select friend_code from test_carol_code))),
  1,
  'Alice peut résoudre le code ami de Carol via find_user_by_code'
);

select is(
  (select count(*)::int from find_user_by_code('AAAAAA')),
  0,
  'Un code ami inexistant ne renvoie aucune ligne'
);

-- Régression : find_user_by_code ne doit pas être appelable sans être
-- connecté (le grant EXECUTE par défaut à PUBLIC avait été oublié).
reset role;
set local role anon;
select throws_ok(
  $$ select * from find_user_by_code((select friend_code from test_carol_code)) $$,
  '42501',
  'find_user_by_code est refusée pour un appelant anonyme (non connecté)'
);

select * from finish();
rollback;
