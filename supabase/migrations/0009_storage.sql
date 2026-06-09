-- 0009_storage.sql
-- Private bucket for test photos. Objects are pathed "{user_id}/{test_id}/{uuid}.{ext}".
-- A user may read/write/delete only objects whose FIRST path segment equals their
-- auth.uid(). The bucket is private, so reads go through short-lived signed URLs
-- (created client-side with the user's JWT — RLS still scopes them to own files).

insert into storage.buckets (id, name, public)
values ('test-photos', 'test-photos', false)
on conflict (id) do nothing;

create policy "test_photos_objects_select_own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'test-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "test_photos_objects_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'test-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "test_photos_objects_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'test-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'test-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "test_photos_objects_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'test-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
