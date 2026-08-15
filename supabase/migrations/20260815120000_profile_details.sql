-- Richer app profiles: school details, contact, parent–child link.

alter table public.profiles
  add column if not exists grade text,
  add column if not exists school_name text,
  add column if not exists phone text,
  add column if not exists parent_id uuid references public.profiles (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists profiles_parent_id_idx on public.profiles (parent_id);

alter table public.profiles
  add constraint profiles_grade_chk
  check (grade is null or grade in ('10', '11', '12'));

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Parents can read linked children (needed for childIds / parent portal).
drop policy if exists "Parents can select linked children" on public.profiles;
create policy "Parents can select linked children"
  on public.profiles
  for select
  to authenticated
  using (parent_id = auth.uid());

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
  meta_grade text := new.raw_user_meta_data ->> 'grade';
  meta_school text := new.raw_user_meta_data ->> 'school_name';
  meta_phone text := new.raw_user_meta_data ->> 'phone';
  resolved_role public.role;
  resolved_grade text;
begin
  begin
    resolved_role := meta_role::public.role;
  exception
    when invalid_text_representation then
      resolved_role := 'student'::public.role;
  end;

  if resolved_role = 'student' then
    resolved_grade := coalesce(nullif(meta_grade, ''), '12');
  else
    resolved_grade := nullif(meta_grade, '');
  end if;

  insert into public.profiles (
    id, name, email, role, province, municipality, grade, school_name, phone
  )
  values (
    new.id,
    meta_name,
    lower(new.email),
    resolved_role,
    nullif(meta_province, ''),
    nullif(meta_municipality, ''),
    resolved_grade,
    nullif(meta_school, ''),
    nullif(meta_phone, '')
  )
  on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      role = excluded.role,
      province = excluded.province,
      municipality = excluded.municipality,
      grade = excluded.grade,
      school_name = excluded.school_name,
      phone = excluded.phone;

  return new;
end;
$$;
