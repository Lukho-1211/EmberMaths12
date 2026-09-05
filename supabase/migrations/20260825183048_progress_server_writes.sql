-- Phase 1 backend: curriculum answers/memos are admin-only via SELECT;
-- student_progress and corrections writes move to server APIs via
-- security-definer RPCs (and service_role when configured).
-- Empty student_progress row is created on student signup.

-- ---------------------------------------------------------------------------
-- Curriculum: only admins can SELECT (students/teachers/parents use GET /api/curriculum)
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated can read curriculum" on public.curriculum;

drop policy if exists "Admins can select curriculum" on public.curriculum;
create policy "Admins can select curriculum"
  on public.curriculum
  for select
  to authenticated
  using (public.is_admin());

-- Full curriculum for authenticated API scoring (bypasses RLS; called only from server routes).
create or replace function public.get_curriculum_row()
returns table (terms jsonb, badges jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select c.terms, c.badges
  from public.curriculum c
  where c.id = 'default';
$$;

revoke all on function public.get_curriculum_row() from public;
-- Only service_role may fetch full curriculum (answer keys). Authenticated
-- clients must use GET /api/curriculum which strips secrets.
grant execute on function public.get_curriculum_row() to service_role;

-- ---------------------------------------------------------------------------
-- student_progress: keep SELECT for rankings/parents; revoke client writes
-- ---------------------------------------------------------------------------
drop policy if exists "Students upsert own progress" on public.student_progress;
drop policy if exists "Students update own progress" on public.student_progress;
drop policy if exists "Admins delete progress" on public.student_progress;

revoke insert, update, delete on table public.student_progress from authenticated;
grant select on table public.student_progress to authenticated;
grant all on table public.student_progress to service_role;

create or replace function public.upsert_student_progress(
  p_student_id uuid,
  p_completed_lesson_ids text[],
  p_test_scores jsonb,
  p_badge_ids text[],
  p_overall_percent integer,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_student_id <> auth.uid() and not public.is_admin_or_teacher() then
    raise exception 'forbidden';
  end if;
  if p_status not in ('passing', 'failing', 'pending') then
    raise exception 'invalid status';
  end if;

  insert into public.student_progress (
    student_id,
    completed_lesson_ids,
    test_scores,
    badge_ids,
    overall_percent,
    status,
    updated_at
  )
  values (
    p_student_id,
    coalesce(p_completed_lesson_ids, '{}'),
    coalesce(p_test_scores, '{}'::jsonb),
    coalesce(p_badge_ids, '{}'),
    coalesce(p_overall_percent, 0),
    p_status,
    now()
  )
  on conflict (student_id) do update
    set
      completed_lesson_ids = excluded.completed_lesson_ids,
      test_scores = excluded.test_scores,
      badge_ids = excluded.badge_ids,
      overall_percent = excluded.overall_percent,
      status = excluded.status,
      updated_at = now();
end;
$$;

revoke all on function public.upsert_student_progress(uuid, text[], jsonb, text[], integer, text) from public;
grant execute on function public.upsert_student_progress(uuid, text[], jsonb, text[], integer, text) to authenticated;
grant execute on function public.upsert_student_progress(uuid, text[], jsonb, text[], integer, text) to service_role;

-- ---------------------------------------------------------------------------
-- corrections: revoke student INSERT; paper-scan API uses RPC / service role
-- ---------------------------------------------------------------------------
drop policy if exists "Insert corrections" on public.corrections;

revoke insert, update, delete on table public.corrections from authenticated;
grant select on table public.corrections to authenticated;
grant all on table public.corrections to service_role;

create or replace function public.insert_correction_row(
  p_id uuid,
  p_student_id uuid,
  p_file_name text,
  p_score integer,
  p_feedback jsonb,
  p_summary text,
  p_assessment_id text,
  p_assessment_title text,
  p_mode text,
  p_question_feedback jsonb,
  p_created_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_student_id <> auth.uid() and not public.is_admin_or_teacher() then
    raise exception 'forbidden';
  end if;

  insert into public.corrections (
    id,
    student_id,
    file_name,
    score,
    feedback,
    summary,
    assessment_id,
    assessment_title,
    mode,
    question_feedback,
    created_at
  )
  values (
    p_id,
    p_student_id,
    p_file_name,
    p_score,
    coalesce(p_feedback, '[]'::jsonb),
    coalesce(p_summary, ''),
    p_assessment_id,
    p_assessment_title,
    p_mode,
    p_question_feedback,
    coalesce(p_created_at, now())
  );
end;
$$;

revoke all on function public.insert_correction_row(uuid, uuid, text, integer, jsonb, text, text, text, text, jsonb, timestamptz) from public;
grant execute on function public.insert_correction_row(uuid, uuid, text, integer, jsonb, text, text, text, text, jsonb, timestamptz) to authenticated;
grant execute on function public.insert_correction_row(uuid, uuid, text, integer, jsonb, text, text, text, text, jsonb, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- Signup: empty student_progress when a student profile is created
-- ---------------------------------------------------------------------------
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
