-- Vérifie les règles du hors-série sur books : valeur par défaut, numéro de
-- tome entier, hors-série obligatoirement rattaché à une série, et ce qui
-- reste permis (numéro facultatif, même numéro qu'un tome régulier).
begin;
select plan(14);

create extension if not exists pgtap;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@test.local');

-- Par défaut, un livre n'est pas un hors-série.
insert into books (id, user_id, title) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sans série');

select is(
  (select is_off_series from books where id = '10000000-0000-0000-0000-000000000001'),
  false,
  'Un livre créé sans préciser est un livre ordinaire (pas hors-série)'
);

-- Hors-série dans une série : permis, avec ou sans numéro, et même numéro
-- qu'un tome régulier.
select lives_ok(
  $$ insert into books (user_id, title, series, series_index, is_off_series)
     values ('00000000-0000-0000-0000-000000000001', 'Tome 2', 'Dune', 2, false) $$,
  'Un tome régulier numéroté 2 est accepté'
);

select lives_ok(
  $$ insert into books (user_id, title, series, series_index, is_off_series)
     values ('00000000-0000-0000-0000-000000000001', 'HS 2', 'Dune', 2, true) $$,
  'Un hors-série numéroté 2 coexiste avec le tome 2 de la même série'
);

select lives_ok(
  $$ insert into books (user_id, title, series, series_index, is_off_series)
     values ('00000000-0000-0000-0000-000000000001', 'HS sans numéro', 'Dune', null, true) $$,
  'Un hors-série sans numéro est accepté'
);

-- Un hors-série sans série n'a pas de sens.
select throws_like(
  $$ insert into books (user_id, title, series, is_off_series)
     values ('00000000-0000-0000-0000-000000000001', 'HS orphelin', null, true) $$,
  '%books_off_series_needs_series%',
  'Un hors-série sans série est refusé à la création'
);

select throws_like(
  $$ update books set series = null where title = 'HS 2' $$,
  '%books_off_series_needs_series%',
  'On ne peut pas retirer la série d''un hors-série'
);

select lives_ok(
  $$ update books set is_off_series = false, series = null where title = 'HS 2' $$,
  'On peut en revanche le repasser en livre ordinaire en retirant la série'
);

-- Les numéros de tome sont des entiers.
select lives_ok(
  $$ insert into books (user_id, title, series, series_index)
     values ('00000000-0000-0000-0000-000000000001', 'Tome 0', 'Prélude', 0) $$,
  'Le tome 0 est accepté'
);

select lives_ok(
  $$ insert into books (user_id, title, series, series_index)
     values ('00000000-0000-0000-0000-000000000001', 'Tome 336', 'Prélude', 336) $$,
  'Un grand numéro entier est accepté'
);

select throws_like(
  $$ insert into books (user_id, title, series, series_index)
     values ('00000000-0000-0000-0000-000000000001', 'Tome 1,5', 'Prélude', 1.5) $$,
  '%books_series_index_whole%',
  'Un numéro de tome décimal (1,5) est refusé'
);

select throws_like(
  $$ insert into books (user_id, title, series, series_index)
     values ('00000000-0000-0000-0000-000000000001', 'Tome 0,5', 'Prélude', 0.5) $$,
  '%books_series_index_whole%',
  'Le demi-tome 0,5 est refusé aussi'
);

select throws_like(
  $$ update books set series_index = 2.5 where title = 'Tome 2' $$,
  '%books_series_index_whole%',
  'Passer un tome existant en décimal par modification est refusé'
);

select lives_ok(
  $$ update books set series_index = null where title = 'Tome 2' $$,
  'Retirer le numéro d''un tome reste permis'
);

-- La colonne ne peut pas être vide.
select throws_like(
  $$ insert into books (user_id, title, is_off_series)
     values ('00000000-0000-0000-0000-000000000001', 'Nul', null) $$,
  '%null value%',
  'is_off_series ne peut pas être NULL'
);

select * from finish();
rollback;
