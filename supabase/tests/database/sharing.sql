-- Vérifie le partage en lecture books/reading_goals basé sur
-- household_links (accepted uniquement), en particulier les deux bugs déjà
-- rencontrés en prod : un compte tiers non lié qui voit trop, et un lien
-- encore "pending" qui donne accès avant acceptation.
begin;
select plan(12);

create extension if not exists pgtap;

-- Alice et Bob seront liés (accepted). Carol reste solo : elle ne doit
-- jamais apparaître dans ce qu'Alice/Bob voient, ni l'inverse.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'carol@test.local');

insert into household_links (requester_id, target_id, status) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'accepted');

insert into books (id, user_id, title) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Livre d''Alice'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Livre de Bob'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Livre de Carol');

insert into reading_goals (user_id, year, goal) values
  ('00000000-0000-0000-0000-000000000001', 2026, 20),
  ('00000000-0000-0000-0000-000000000002', 2026, 15),
  ('00000000-0000-0000-0000-000000000003', 2026, 10);

-- Se fait passer pour Alice.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000001', 'role', 'authenticated')::text,
  true
);

select ok(
  exists(select 1 from books where id = '10000000-0000-0000-0000-000000000001'),
  'Alice voit son propre livre'
);

select ok(
  exists(select 1 from books where id = '10000000-0000-0000-0000-000000000002'),
  'Alice voit le livre de Bob (lien accepté)'
);

select ok(
  not exists(select 1 from books where id = '10000000-0000-0000-0000-000000000003'),
  'Alice ne voit PAS le livre de Carol (aucun lien)'
);

select is(
  (with attempt as (
    update books set title = 'piraté'
    where id = '10000000-0000-0000-0000-000000000002'
    returning 1
  ) select count(*)::int from attempt),
  0,
  'Alice ne peut pas modifier le livre de Bob malgré le partage en lecture'
);

select is(
  (with attempt as (
    delete from books
    where id = '10000000-0000-0000-0000-000000000002'
    returning 1
  ) select count(*)::int from attempt),
  0,
  'Alice ne peut pas supprimer le livre de Bob malgré le partage en lecture'
);

select ok(
  exists(select 1 from reading_goals where user_id = '00000000-0000-0000-0000-000000000001' and year = 2026),
  'Alice voit son propre objectif de lecture'
);

select ok(
  exists(select 1 from reading_goals where user_id = '00000000-0000-0000-0000-000000000002' and year = 2026),
  'Alice voit l''objectif de Bob (lien accepté)'
);

select ok(
  not exists(select 1 from reading_goals where user_id = '00000000-0000-0000-0000-000000000003' and year = 2026),
  'Alice ne voit PAS l''objectif de Carol (aucun lien)'
);

-- Se fait passer pour Bob : vérifie que le partage marche dans les deux
-- sens même si Bob est la "target" du lien, pas le "requester".
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select ok(
  exists(select 1 from books where id = '10000000-0000-0000-0000-000000000001'),
  'Bob voit le livre d''Alice (lien accepté, Bob est target)'
);

select ok(
  not exists(select 1 from books where id = '10000000-0000-0000-0000-000000000003'),
  'Bob ne voit PAS le livre de Carol (aucun lien)'
);

-- Se fait passer pour Carol : solo, ne doit voir qu'elle-même. C'est
-- exactement le bug "compte tiers voit tout" déjà rencontré en prod.
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000003', 'role', 'authenticated')::text,
  true
);

select is(
  (select count(*)::int from books),
  1,
  'Carol (solo, aucun lien) ne voit que son propre livre'
);

-- Un lien "pending" (pas encore accepté) ne doit donner accès à rien.
reset role;
insert into household_links (requester_id, target_id, status) values
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'pending');

set local role authenticated;
select set_config(
  'request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-000000000002', 'role', 'authenticated')::text,
  true
);

select ok(
  not exists(select 1 from books where id = '10000000-0000-0000-0000-000000000003'),
  'Bob ne voit PAS le livre de Carol tant que le lien est "pending"'
);

select * from finish();
rollback;
