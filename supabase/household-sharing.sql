-- Ma Bibliothèque — partage en lecture entre les deux comptes du foyer
-- Chacun peut voir les livres de l'autre, mais ne peut modifier/supprimer
-- que les siens. Remplace l'unique policy "for all" par 4 policies dédiées.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

drop policy "Users can manage their own books" on books;

create policy "Household members can view all household books"
  on books for select
  using (auth.uid() in (
    '62c4fc66-007a-4018-bbf1-42c0990284c0',
    '3d041fdc-b619-46a4-8fed-743cce2269f6'
  ));

create policy "Users can insert their own books"
  on books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own books"
  on books for delete
  using (auth.uid() = user_id);
