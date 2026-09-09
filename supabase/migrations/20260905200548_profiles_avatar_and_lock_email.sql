-- Profile avatars + lock email/role on profiles UPDATE.

alter table public.profiles
  add column if not exists avatar_url text;

-- Reject client attempts to change email or role after signup.
create or replace function public.profiles_lock_email_and_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    raise exception 'profiles.email cannot be changed';
  end if;
  if new.role is distinct from old.role then
    raise exception 'profiles.role cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_email_and_role on public.profiles;
create trigger profiles_lock_email_and_role
  before update on public.profiles
  for each row
  execute function public.profiles_lock_email_and_role();

-- Storage: profile-avatars bucket (~2 MB, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Authenticated can select profile avatars" on storage.objects;
create policy "Authenticated can select profile avatars"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'profile-avatars');

drop policy if exists "Public can read profile avatars" on storage.objects;
create policy "Public can read profile avatars"
  on storage.objects
  for select
  to public
  using (bucket_id = 'profile-avatars');
