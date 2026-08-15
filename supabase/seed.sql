-- Demo auth users, profiles, and student roster for Ember Maths12.
-- Idempotent: safe to re-run. Password for all demo logins: ember12

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_admin uuid;
  v_teacher uuid;
  v_student uuid;
  v_parent uuid;
  v_pwd text := crypt('ember12', gen_salt('bf'));
  v_instance uuid := '00000000-0000-0000-0000-000000000000';
begin
  select id into v_admin from auth.users where lower(email) = 'admin@ember12.za';
  if v_admin is null then
    v_admin := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_instance, v_admin, 'authenticated', 'authenticated', 'admin@ember12.za', v_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Thandi Admin","role":"admin","phone":"+27 11 555 0001"}'::jsonb,
      '2026-01-05T08:00:00Z'::timestamptz, now(),
      '', '', '', ''
    );
    insert into auth.identities (
      user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_admin, v_admin::text,
      jsonb_build_object('sub', v_admin::text, 'email', 'admin@ember12.za'),
      'email', now(), now(), now()
    );
  else
    update auth.users
      set encrypted_password = v_pwd,
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = '{"name":"Thandi Admin","role":"admin","phone":"+27 11 555 0001"}'::jsonb
      where id = v_admin;
  end if;

  select id into v_teacher from auth.users where lower(email) = 'teacher@ember12.za';
  if v_teacher is null then
    v_teacher := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_instance, v_teacher, 'authenticated', 'authenticated', 'teacher@ember12.za', v_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Mr. Naidoo","role":"teacher","school_name":"Ember Maths Academy","phone":"+27 11 555 0200"}'::jsonb,
      '2026-01-06T08:00:00Z'::timestamptz, now(),
      '', '', '', ''
    );
    insert into auth.identities (
      user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_teacher, v_teacher::text,
      jsonb_build_object('sub', v_teacher::text, 'email', 'teacher@ember12.za'),
      'email', now(), now(), now()
    );
  else
    update auth.users
      set encrypted_password = v_pwd,
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = '{"name":"Mr. Naidoo","role":"teacher","school_name":"Ember Maths Academy","phone":"+27 11 555 0200"}'::jsonb
      where id = v_teacher;
  end if;

  select id into v_parent from auth.users where lower(email) = 'parent@ember12.za';
  if v_parent is null then
    v_parent := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_instance, v_parent, 'authenticated', 'authenticated', 'parent@ember12.za', v_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Mrs. Molefe","role":"parent","phone":"+27 82 555 0102"}'::jsonb,
      '2026-01-07T11:00:00Z'::timestamptz, now(),
      '', '', '', ''
    );
    insert into auth.identities (
      user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_parent, v_parent::text,
      jsonb_build_object('sub', v_parent::text, 'email', 'parent@ember12.za'),
      'email', now(), now(), now()
    );
  else
    update auth.users
      set encrypted_password = v_pwd,
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = '{"name":"Mrs. Molefe","role":"parent","phone":"+27 82 555 0102"}'::jsonb
      where id = v_parent;
  end if;

  select id into v_student from auth.users where lower(email) = 'student@ember12.za';
  if v_student is null then
    v_student := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      v_instance, v_student, 'authenticated', 'authenticated', 'student@ember12.za', v_pwd, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Lerato Molefe","role":"student","province":"Gauteng","municipality":"City of Johannesburg","grade":"12","school_name":"Ember Maths Academy","phone":"+27 82 555 0101"}'::jsonb,
      '2026-01-07T08:00:00Z'::timestamptz, now(),
      '', '', '', ''
    );
    insert into auth.identities (
      user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_student, v_student::text,
      jsonb_build_object('sub', v_student::text, 'email', 'student@ember12.za'),
      'email', now(), now(), now()
    );
  else
    update auth.users
      set encrypted_password = v_pwd,
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          raw_user_meta_data = '{"name":"Lerato Molefe","role":"student","province":"Gauteng","municipality":"City of Johannesburg","grade":"12","school_name":"Ember Maths Academy","phone":"+27 82 555 0101"}'::jsonb
      where id = v_student;
  end if;

  insert into public.profiles (
    id, name, email, role, province, municipality, grade, school_name, phone, created_at
  )
  values
    (v_admin, 'Thandi Admin', 'admin@ember12.za', 'admin', null, null, null, null, '+27 11 555 0001', '2026-01-05T08:00:00Z'),
    (v_teacher, 'Mr. Naidoo', 'teacher@ember12.za', 'teacher', null, null, null, 'Ember Maths Academy', '+27 11 555 0200', '2026-01-06T08:00:00Z'),
    (v_parent, 'Mrs. Molefe', 'parent@ember12.za', 'parent', null, null, null, null, '+27 82 555 0102', '2026-01-07T11:00:00Z'),
    (v_student, 'Lerato Molefe', 'student@ember12.za', 'student', 'Gauteng', 'City of Johannesburg', '12', 'Ember Maths Academy', '+27 82 555 0101', '2026-01-07T08:00:00Z')
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

  update public.profiles
    set parent_id = v_parent
    where id = v_student;

  insert into public.student (
    name, email, grade, school_name, province, municipality, phone, profile_id
  )
  values
    ('Lerato Molefe', 'student@ember12.za', '12', 'Ember Maths Academy', 'Gauteng', 'City of Johannesburg', '+27 82 555 0101', v_student),
    ('Sipho Dlamini', 'sipho.dlamini@ember12.za', '12', 'Ember Maths Academy', 'KwaZulu-Natal', 'eThekwini', '+27 83 555 0202', null),
    ('Aisha Patel', 'aisha.patel@ember12.za', '11', 'Ember Maths Academy', 'Western Cape', 'City of Cape Town', '+27 84 555 0303', null),
    ('Thabo Mokoena', 'thabo.mokoena@ember12.za', '10', 'Ember Maths Academy', 'Free State', 'Mangaung', '+27 72 555 0404', null)
  on conflict (email) do update
    set
      name = excluded.name,
      grade = excluded.grade,
      school_name = excluded.school_name,
      province = excluded.province,
      municipality = excluded.municipality,
      phone = excluded.phone,
      profile_id = coalesce(excluded.profile_id, public.student.profile_id);
end $$;
