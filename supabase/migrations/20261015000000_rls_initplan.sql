-- Performance des policies RLS (aucun changement de droits).
--
-- 1. `auth.uid()` nu dans une policy est réévalué pour CHAQUE ligne
--    examinée. Enveloppé dans `(select auth.uid())`, Postgres le calcule une
--    seule fois par requête (InitPlan). Recommandation Supabase, sans effet
--    sur ce qui est autorisé.
--
-- 2. `is_household_member(user_id)` s'exécute lui aussi une fois par ligne
--    (deux jointures sur profiles à chaque appel), donc un `select *` sur
--    books la rejoue pour chaque livre de la table. On l'échange, pour les
--    policies de lecture du foyer, contre `user_id in (select
--    household_member_ids())`, dont la sous-requête ne dépend pas de la
--    ligne et n'est donc évaluée qu'une fois. Même ensemble d'utilisateurs :
--    les membres du foyer de l'appelant, lui compris.
--
-- is_household_member() reste en place (policy de lecture des profils).

create or replace function household_member_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select other.user_id
  from profiles me
  join profiles other on other.household_id = me.household_id
  where me.user_id = (select auth.uid())
    and me.household_id is not null;
$$;

revoke execute on function household_member_ids() from public, anon, service_role;
grant execute on function household_member_ids() to authenticated;

-- profiles ------------------------------------------------------------

drop policy "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile"
  on profiles for insert
  with check ((select auth.uid()) = user_id);

drop policy "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "Users can view their own profile" on profiles;
create policy "Users can view their own profile"
  on profiles for select
  using (user_id = (select auth.uid()));

-- books ---------------------------------------------------------------

drop policy "Users can view their own books" on books;
create policy "Users can view their own books"
  on books for select
  using (user_id = (select auth.uid()));

drop policy "Household (foyer) members can view all household books" on books;
create policy "Household (foyer) members can view all household books"
  on books for select
  using (user_id in (select household_member_ids()));

drop policy "Users can insert their own books" on books;
create policy "Users can insert their own books"
  on books for insert
  with check ((select auth.uid()) = user_id);

drop policy "Users can update their own books" on books;
create policy "Users can update their own books"
  on books for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy "Users can delete their own books" on books;
create policy "Users can delete their own books"
  on books for delete
  using ((select auth.uid()) = user_id);

-- reading_goals -------------------------------------------------------

drop policy "Users can view their own reading goals" on reading_goals;
create policy "Users can view their own reading goals"
  on reading_goals for select
  using (user_id = (select auth.uid()));

drop policy "Household (foyer) members can view all household reading goals" on reading_goals;
create policy "Household (foyer) members can view all household reading goals"
  on reading_goals for select
  using (user_id in (select household_member_ids()));

drop policy "Users can insert their own reading goals" on reading_goals;
create policy "Users can insert their own reading goals"
  on reading_goals for insert
  with check ((select auth.uid()) = user_id);

drop policy "Users can update their own reading goals" on reading_goals;
create policy "Users can update their own reading goals"
  on reading_goals for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- achievement_claims --------------------------------------------------

drop policy "Users can view their own achievement claims" on achievement_claims;
create policy "Users can view their own achievement claims"
  on achievement_claims for select
  using (user_id = (select auth.uid()));

drop policy "Household (foyer) members can view achievement claims" on achievement_claims;
create policy "Household (foyer) members can view achievement claims"
  on achievement_claims for select
  using (user_id in (select household_member_ids()));

drop policy "Users can insert their own achievement claims" on achievement_claims;
create policy "Users can insert their own achievement claims"
  on achievement_claims for insert
  with check ((select auth.uid()) = user_id);

drop policy "Users can update their own achievement claims" on achievement_claims;
create policy "Users can update their own achievement claims"
  on achievement_claims for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
