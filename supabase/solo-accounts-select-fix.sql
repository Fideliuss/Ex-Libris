-- Ex Libris — corrige la règle de lecture pour permettre des comptes solo.
-- La règle actuelle n'autorise à voir des livres que si la personne qui
-- fait la requête fait partie des deux comptes du foyer codés en dur — un
-- nouveau compte (ex: pour un test avec un tiers) pourrait donc ajouter ses
-- propres livres mais ne jamais les voir apparaître. On ajoute "voir ses
-- propres lignes" en plus du partage de foyer existant, sans rien retirer.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

drop policy "Household members can view all household books" on books;

create policy "Household members can view all household books"
  on books for select
  using (
    user_id = auth.uid()
    or auth.uid() in (
      '62c4fc66-007a-4018-bbf1-42c0990284c0',
      '3d041fdc-b619-46a4-8fed-743cce2269f6'
    )
  );

drop policy "Household members can view all household reading goals" on reading_goals;

create policy "Household members can view all household reading goals"
  on reading_goals for select
  using (
    user_id = auth.uid()
    or auth.uid() in (
      '62c4fc66-007a-4018-bbf1-42c0990284c0',
      '3d041fdc-b619-46a4-8fed-743cce2269f6'
    )
  );
