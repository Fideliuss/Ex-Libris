-- Vérifie les policies de household_links : qui peut envoyer/accepter/
-- supprimer une demande, et les contraintes anti-usurpation/doublon.
begin;
select plan(9);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'carol@test.local');

-- Se fait passer pour Alice.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select lives_ok(
  $$ insert into household_links (requester_id, target_id)
     values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') $$,
  'Alice peut envoyer une demande de lien à Bob'
);

select throws_like(
  $$ insert into household_links (requester_id, target_id)
     values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003') $$,
  '%row-level security%',
  'Alice ne peut pas créer une demande au nom de Bob (usurpation de requester_id)'
);

select throws_ok(
  $$ insert into household_links (requester_id, target_id)
     values ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001') $$,
  '23514',
  'Impossible de créer un lien avec soi-même (contrainte household_links_no_self_link)'
);

-- La contrainte d'unicité par paire (least/greatest) doit rejeter le
-- doublon même dans le sens inverse. Testé côté postgres pour isoler la
-- contrainte de la policy RLS d'insertion.
reset role;
select throws_ok(
  $$ insert into household_links (requester_id, target_id)
     values ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001') $$,
  '23505',
  'Une deuxième demande pour la même paire, dans l''autre sens, est rejetée'
);

-- Bob accepte la demande d'Alice.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

-- Une CTE modificatrice (update/delete ... returning) doit être au niveau
-- racine de la requête, pas imbriquée comme argument de select is(...) :
-- on la fait tourner seule via `create temporary table ... as with ...`.
create temporary table test_bob_accepts as
with attempt as (
  update household_links set status = 'accepted'
  where requester_id = '00000000-0000-0000-0000-000000000001'
    and target_id = '00000000-0000-0000-0000-000000000002'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_bob_accepts),
  1,
  'Bob (la cible) peut accepter la demande'
);

-- Un nouveau lien pending Alice -> Carol : Alice (la demandeuse) ne doit
-- pas pouvoir l'accepter elle-même.
reset role;
insert into household_links (requester_id, target_id, status) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'pending');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

create temporary table test_alice_self_accept as
with attempt as (
  update household_links set status = 'accepted'
  where requester_id = '00000000-0000-0000-0000-000000000001'
    and target_id = '00000000-0000-0000-0000-000000000003'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_alice_self_accept),
  0,
  'Alice (la demandeuse) ne peut pas accepter sa propre demande'
);

create temporary table test_alice_cancel_own as
with attempt as (
  delete from household_links
  where requester_id = '00000000-0000-0000-0000-000000000001'
    and target_id = '00000000-0000-0000-0000-000000000003'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_alice_cancel_own),
  1,
  'Alice peut annuler (supprimer) sa propre demande en attente'
);

-- Carol n'est partie ni au lien Alice<->Bob : elle ne doit ni le voir, ni
-- pouvoir le supprimer.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

select ok(
  not exists(
    select 1 from household_links
    where requester_id = '00000000-0000-0000-0000-000000000001'
      and target_id = '00000000-0000-0000-0000-000000000002'
  ),
  'Carol (tierce partie) ne voit pas le lien Alice<->Bob'
);

create temporary table test_carol_delete as
with attempt as (
  delete from household_links
  where requester_id = '00000000-0000-0000-0000-000000000001'
    and target_id = '00000000-0000-0000-0000-000000000002'
  returning 1
)
select count(*)::int as n from attempt;

select is(
  (select n from test_carol_delete),
  0,
  'Carol (tierce partie) ne peut pas supprimer le lien Alice<->Bob'
);

select * from finish();
rollback;
