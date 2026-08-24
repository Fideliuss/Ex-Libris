-- Ex Libris — corrige une vraie faille de portée dans les règles de lecture.
-- La règle actuelle vérifie "est-ce que la personne qui demande fait partie
-- du foyer" (auth.uid() in (...)) mais jamais "est-ce que la LIGNE demandée
-- appartient au foyer" (user_id in (...)). Résultat : Brayan et Bradley
-- pouvaient voir l'intégralité des livres de N'IMPORTE QUEL compte solo
-- tiers (ex: un nouveau compte créé via l'inscription publique), pas
-- seulement les livres de l'autre membre du foyer. Ça explique aussi le bug
-- des "52 livres au lieu de 257" : la requête (limitée à 1000 lignes côté
-- serveur, triée par date d'ajout) ramenait les lignes les plus récentes de
-- TOUTE la table combinée, pas seulement celles de Brayan.
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

drop policy "Household members can view all household books" on books;

create policy "Household members can view all household books"
  on books for select
  using (
    user_id = auth.uid()
    or (
      auth.uid() in (
        '62c4fc66-007a-4018-bbf1-42c0990284c0',
        '3d041fdc-b619-46a4-8fed-743cce2269f6'
      )
      and user_id in (
        '62c4fc66-007a-4018-bbf1-42c0990284c0',
        '3d041fdc-b619-46a4-8fed-743cce2269f6'
      )
    )
  );

drop policy "Household members can view all household reading goals" on reading_goals;

create policy "Household members can view all household reading goals"
  on reading_goals for select
  using (
    user_id = auth.uid()
    or (
      auth.uid() in (
        '62c4fc66-007a-4018-bbf1-42c0990284c0',
        '3d041fdc-b619-46a4-8fed-743cce2269f6'
      )
      and user_id in (
        '62c4fc66-007a-4018-bbf1-42c0990284c0',
        '3d041fdc-b619-46a4-8fed-743cce2269f6'
      )
    )
  );
