-- Admin role may only be assigned when app_metadata.role = 'admin'
-- (service-role createUser / seed). Browser signUp can only set user_metadata,
-- so a crafted signup with user_metadata.role = admin must not become an admin.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_role text := new.raw_app_meta_data ->> 'role';
  user_role text := new.raw_user_meta_data ->> 'role';
  meta_role text;
  meta_name text := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));
  meta_province text := new.raw_user_meta_data ->> 'province';
  meta_municipality text := new.raw_user_meta_data ->> 'municipality';
  meta_grade text := new.raw_user_meta_data ->> 'grade';
  meta_school text := new.raw_user_meta_data ->> 'school_name';
  meta_phone text := new.raw_user_meta_data ->> 'phone';
  resolved_role public.role;
  resolved_grade text;
begin
  -- Prefer app_metadata (service role). Fall back to user_metadata for public
  -- signup roles only — never trust user_metadata for admin.
  if app_role = 'admin' then
    meta_role := 'admin';
  elsif coalesce(user_role, '') = 'admin' then
    meta_role := 'student';
  else
    meta_role := coalesce(nullif(user_role, ''), nullif(app_role, ''), 'student');
  end if;

  begin
    resolved_role := meta_role::public.role;
  exception
    when invalid_text_representation then
      resolved_role := 'student'::public.role;
  end;

  if resolved_role = 'admin' and coalesce(app_role, '') <> 'admin' then
    resolved_role := 'student'::public.role;
  end if;

  update auth.users
  set raw_app_meta_data =
    coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', resolved_role::text)
  where id = new.id;

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

  if resolved_role = 'student' then
    insert into public.student (
      profile_id, name, email, grade, school_name, province, municipality, phone
    )
    values (
      new.id,
      meta_name,
      lower(new.email),
      coalesce(resolved_grade, '12'),
      nullif(meta_school, ''),
      nullif(meta_province, ''),
      nullif(meta_municipality, ''),
      nullif(meta_phone, '')
    )
    on conflict (email) do update
      set
        profile_id = excluded.profile_id,
        name = excluded.name,
        grade = excluded.grade,
        school_name = coalesce(excluded.school_name, public.student.school_name),
        province = coalesce(excluded.province, public.student.province),
        municipality = coalesce(excluded.municipality, public.student.municipality),
        phone = coalesce(excluded.phone, public.student.phone);

    insert into public.student_progress (student_id)
    values (new.id)
    on conflict (student_id) do nothing;
  end if;

  return new;
end;
$$;
