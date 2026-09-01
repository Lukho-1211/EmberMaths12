-- Harden lesson-videos Storage RLS: wrap is_admin() in (select ...) for
-- initplan caching, and keep admin-only writes + authenticated/public reads.

drop policy if exists "Admins can upload lesson videos" on storage.objects;
create policy "Admins can upload lesson videos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'lesson-videos' and (select public.is_admin()));

drop policy if exists "Admins can update lesson videos" on storage.objects;
create policy "Admins can update lesson videos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'lesson-videos' and (select public.is_admin()))
  with check (bucket_id = 'lesson-videos' and (select public.is_admin()));

drop policy if exists "Authenticated can select lesson videos" on storage.objects;
create policy "Authenticated can select lesson videos"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'lesson-videos');

drop policy if exists "Public can read lesson videos" on storage.objects;
create policy "Public can read lesson videos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'lesson-videos');

drop policy if exists "Admins can delete lesson videos" on storage.objects;
create policy "Admins can delete lesson videos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'lesson-videos' and (select public.is_admin()));
