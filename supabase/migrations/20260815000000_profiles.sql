-- Ember Maths12 Slice 1: app profiles linked to Supabase Auth users.

create type public.role as enum ('admin', 'student', 'teacher', 'parent');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.role not null,
  province text,
  municipality text,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

create policy "Users can select own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Copy signup metadata into profiles when an auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  meta_name text := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));
  meta_province text := new.raw_user_meta_data ->> 'province';
  meta_municipality text := new.raw_user_meta_data ->> 'municipality';
  resolved_role public.role;
begin
  begin
    resolved_role := meta_role::public.role;
  exception
    when invalid_text_representation then
      resolved_role := 'student'::public.role;
  end;

  insert into public.profiles (id, name, email, role, province, municipality)
  values (
    new.id,
    meta_name,
    lower(new.email),
    resolved_role,
    nullif(meta_province, ''),
    nullif(meta_municipality, '')
  )
  on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      role = excluded.role,
      province = excluded.province,
      municipality = excluded.municipality;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

grant usage on schema public to anon, authenticated, service_role;
grant select, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
