-- Ex Libris : champ Édition, exhaustif et multi-valeurs (ex: "Poche" +
-- "Collector" sur un même livre), distinct de l'éditeur et de la collection
-- éditoriale. À exécuter dans Supabase : Dashboard -> SQL Editor -> New query
--
-- Idempotent vis-à-vis d'une exécution précédente de ce fichier en version
-- "text" simple : convertit la colonne existante en tableau au lieu de la
-- recréer, pour ne pas perdre les valeurs déjà saisies.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'books' and column_name = 'edition'
  ) then
    alter table books add column edition text[];
  elsif (
    select data_type from information_schema.columns
    where table_name = 'books' and column_name = 'edition'
  ) = 'text' then
    alter table books
      alter column edition type text[]
      using case when edition is null then null else array[edition] end;
  end if;
end $$;
