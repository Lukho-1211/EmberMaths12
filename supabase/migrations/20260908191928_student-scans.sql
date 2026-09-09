-- ---------------------------------------------------------------------------
-- Storage: private student-scans bucket (week-test paper scripts)
-- Path: {studentId}/{assessmentId}/{uuid}-{safeName}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-scans',
  'student-scans',
  false,
  20971520,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'application/pdf'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students can upload own scans" on storage.objects;
create policy "Students can upload own scans"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'student-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can select own scans" on storage.objects;
create policy "Students can select own scans"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'student-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can update own scans" on storage.objects;
create policy "Students can update own scans"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'student-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'student-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Students can delete own scans" on storage.objects;
create policy "Students can delete own scans"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'student-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
