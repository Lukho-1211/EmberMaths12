-- Student roster upsert on auth signup + persist role in app_metadata.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data ->> 'role', new.raw_app_meta_data ->> 'role', 'student');
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

  -- AFTER INSERT: persist role into app_metadata via update (NEW assignment would not stick).
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
  end if;

  return new;
end;
$$;
