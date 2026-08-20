-- Ma Bibliothèque — stockage des couvertures importées manuellement
-- À exécuter dans Supabase : Dashboard -> SQL Editor -> New query

-- Bucket public (les couvertures doivent s'afficher sans authentification, comme une image classique)
insert into storage.buckets (id, name, public)
values ('covers', 'covers', true)
on conflict (id) do nothing;

-- Lecture publique de toutes les couvertures
create policy "Public read access to covers"
on storage.objects for select
using (bucket_id = 'covers');

-- Chaque utilisateur ne peut déposer/modifier/supprimer que des fichiers
-- dans son propre dossier : covers/<user_id>/...
create policy "Users can upload their own covers"
on storage.objects for insert
with check (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own covers"
on storage.objects for update
using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own covers"
on storage.objects for delete
using (bucket_id = 'covers' and auth.uid()::text = (storage.foldername(name))[1]);
