-- App state tables: curriculum, progress, classes, groups, messages, corrections,
-- teacher lessons, theme preference, and lesson-files storage. Replaces localStorage.

-- ---------------------------------------------------------------------------
-- Theme on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists theme text not null default 'light';

alter table public.profiles
  drop constraint if exists profiles_theme_chk;

alter table public.profiles
  add constraint profiles_theme_chk check (theme in ('light', 'dark'));

-- ---------------------------------------------------------------------------
-- Helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin'::public.role, false);
$$;

create or replace function public.is_admin_or_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() in ('admin'::public.role, 'teacher'::public.role), false);
$$;

-- Broader profile visibility for roster / rankings / messaging
drop policy if exists "Admins and teachers can select all profiles" on public.profiles;
create policy "Admins and teachers can select all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin_or_teacher());

drop policy if exists "Authenticated can select classmates and teachers" on public.profiles;
create policy "Authenticated can select classmates and teachers"
  on public.profiles
  for select
  to authenticated
  using (
    role in ('admin'::public.role, 'teacher'::public.role)
    or id = auth.uid()
    or parent_id = auth.uid()
    or exists (
      select 1
      from public.profiles child
      where child.id = auth.uid()
        and child.parent_id = profiles.id
    )
  );

-- Rankings / achievers need student roster visibility for all signed-in roles.
drop policy if exists "Authenticated can select student profiles" on public.profiles;
create policy "Authenticated can select student profiles"
  on public.profiles
  for select
  to authenticated
  using (role = 'student'::public.role);

-- ---------------------------------------------------------------------------
-- Curriculum (singleton JSONB tree)
-- ---------------------------------------------------------------------------
create table if not exists public.curriculum (
  id text primary key default 'default',
  terms jsonb not null default '[]'::jsonb,
  badges jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.curriculum enable row level security;

drop policy if exists "Authenticated can read curriculum" on public.curriculum;
create policy "Authenticated can read curriculum"
  on public.curriculum
  for select
  to authenticated
  using (true);

drop policy if exists "Admins can update curriculum" on public.curriculum;
create policy "Admins can update curriculum"
  on public.curriculum
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can insert curriculum" on public.curriculum;
create policy "Admins can insert curriculum"
  on public.curriculum
  for insert
  to authenticated
  with check (public.is_admin());

grant select on table public.curriculum to authenticated;
grant insert, update on table public.curriculum to authenticated;
grant all on table public.curriculum to service_role;

-- ---------------------------------------------------------------------------
-- Student progress
-- ---------------------------------------------------------------------------
create table if not exists public.student_progress (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  completed_lesson_ids text[] not null default '{}',
  test_scores jsonb not null default '{}'::jsonb,
  badge_ids text[] not null default '{}',
  overall_percent integer not null default 0,
  status text not null default 'pending',
  updated_at timestamptz not null default now(),
  constraint student_progress_status_chk check (status in ('passing', 'failing', 'pending'))
);

alter table public.student_progress enable row level security;

drop policy if exists "Students select own progress" on public.student_progress;
create policy "Students select own progress"
  on public.student_progress
  for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin_or_teacher()
    or exists (
      select 1 from public.profiles p
      where p.id = student_progress.student_id and p.parent_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can select all progress" on public.student_progress;
create policy "Authenticated can select all progress"
  on public.student_progress
  for select
  to authenticated
  using (true);

drop policy if exists "Students upsert own progress" on public.student_progress;
create policy "Students upsert own progress"
  on public.student_progress
  for insert
  to authenticated
  with check (
    student_id = auth.uid()
    or public.is_admin_or_teacher()
  );

drop policy if exists "Students update own progress" on public.student_progress;
create policy "Students update own progress"
  on public.student_progress
  for update
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin_or_teacher()
  )
  with check (
    student_id = auth.uid()
    or public.is_admin_or_teacher()
  );

drop policy if exists "Admins delete progress" on public.student_progress;
create policy "Admins delete progress"
  on public.student_progress
  for delete
  to authenticated
  using (public.is_admin());

grant select, insert, update, delete on table public.student_progress to authenticated;
grant all on table public.student_progress to service_role;

-- ---------------------------------------------------------------------------
-- School classes
-- ---------------------------------------------------------------------------
create table if not exists public.school_classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.school_classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'enrolled',
  created_at timestamptz not null default now(),
  primary key (class_id, student_id),
  constraint class_members_status_chk check (status in ('enrolled', 'pending'))
);

create index if not exists class_members_student_id_idx on public.class_members (student_id);
create index if not exists school_classes_teacher_id_idx on public.school_classes (teacher_id);

alter table public.school_classes enable row level security;
alter table public.class_members enable row level security;

drop policy if exists "Authenticated can select classes" on public.school_classes;
create policy "Authenticated can select classes"
  on public.school_classes
  for select
  to authenticated
  using (true);

drop policy if exists "Teachers and admins manage classes" on public.school_classes;
create policy "Teachers and admins manage classes"
  on public.school_classes
  for all
  to authenticated
  using (public.is_admin_or_teacher() or teacher_id = auth.uid())
  with check (public.is_admin_or_teacher() or teacher_id = auth.uid());

drop policy if exists "Authenticated can select class members" on public.class_members;
create policy "Authenticated can select class members"
  on public.class_members
  for select
  to authenticated
  using (true);

drop policy if exists "Teachers admins and students manage membership" on public.class_members;
create policy "Teachers admins and students manage membership"
  on public.class_members
  for all
  to authenticated
  using (
    public.is_admin_or_teacher()
    or student_id = auth.uid()
    or exists (
      select 1 from public.school_classes c
      where c.id = class_members.class_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.is_admin_or_teacher()
    or student_id = auth.uid()
    or exists (
      select 1 from public.school_classes c
      where c.id = class_members.class_id and c.teacher_id = auth.uid()
    )
  );

grant select, insert, update, delete on table public.school_classes to authenticated;
grant select, insert, update, delete on table public.class_members to authenticated;
grant all on table public.school_classes to service_role;
grant all on table public.class_members to service_role;

-- ---------------------------------------------------------------------------
-- Study groups
-- ---------------------------------------------------------------------------
create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  term_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  primary key (group_id, student_id)
);

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;

drop policy if exists "Authenticated can select study groups" on public.study_groups;
create policy "Authenticated can select study groups"
  on public.study_groups
  for select
  to authenticated
  using (true);

drop policy if exists "Admins manage study groups" on public.study_groups;
create policy "Admins manage study groups"
  on public.study_groups
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Authenticated can select group members" on public.study_group_members;
create policy "Authenticated can select group members"
  on public.study_group_members
  for select
  to authenticated
  using (true);

drop policy if exists "Admins manage group members" on public.study_group_members;
create policy "Admins manage group members"
  on public.study_group_members
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on table public.study_groups to authenticated;
grant select, insert, update, delete on table public.study_group_members to authenticated;
grant all on table public.study_groups to service_role;
grant all on table public.study_group_members to service_role;

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid references public.profiles (id) on delete set null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists messages_to_user_id_idx on public.messages (to_user_id);
create index if not exists messages_from_user_id_idx on public.messages (from_user_id);

alter table public.messages enable row level security;

drop policy if exists "Users select own messages" on public.messages;
create policy "Users select own messages"
  on public.messages
  for select
  to authenticated
  using (
    from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or public.is_admin()
  );

drop policy if exists "Users insert messages as sender" on public.messages;
create policy "Users insert messages as sender"
  on public.messages
  for insert
  to authenticated
  with check (from_user_id = auth.uid() or public.is_admin_or_teacher());

drop policy if exists "Recipients update read flag" on public.messages;
create policy "Recipients update read flag"
  on public.messages
  for update
  to authenticated
  using (to_user_id = auth.uid() or public.is_admin())
  with check (to_user_id = auth.uid() or public.is_admin());

grant select, insert, update on table public.messages to authenticated;
grant all on table public.messages to service_role;

-- ---------------------------------------------------------------------------
-- Corrections (paper-scan / practice results)
-- ---------------------------------------------------------------------------
create table if not exists public.corrections (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  score integer not null default 0,
  feedback jsonb not null default '[]'::jsonb,
  summary text not null default '',
  assessment_id text,
  assessment_title text,
  mode text,
  question_feedback jsonb,
  created_at timestamptz not null default now()
);

create index if not exists corrections_student_id_idx on public.corrections (student_id);

alter table public.corrections enable row level security;

drop policy if exists "Select corrections" on public.corrections;
create policy "Select corrections"
  on public.corrections
  for select
  to authenticated
  using (
    student_id = auth.uid()
    or public.is_admin_or_teacher()
    or exists (
      select 1 from public.profiles p
      where p.id = corrections.student_id and p.parent_id = auth.uid()
    )
  );

drop policy if exists "Insert corrections" on public.corrections;
create policy "Insert corrections"
  on public.corrections
  for insert
  to authenticated
  with check (
    student_id = auth.uid()
    or public.is_admin_or_teacher()
  );

grant select, insert on table public.corrections to authenticated;
grant all on table public.corrections to service_role;

-- ---------------------------------------------------------------------------
-- Teacher-created lessons
-- ---------------------------------------------------------------------------
create table if not exists public.teacher_lessons (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  class_id uuid references public.school_classes (id) on delete set null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.teacher_lessons enable row level security;

drop policy if exists "Authenticated select teacher lessons" on public.teacher_lessons;
create policy "Authenticated select teacher lessons"
  on public.teacher_lessons
  for select
  to authenticated
  using (true);

drop policy if exists "Teachers insert own lessons" on public.teacher_lessons;
create policy "Teachers insert own lessons"
  on public.teacher_lessons
  for insert
  to authenticated
  with check (created_by = auth.uid() or public.is_admin_or_teacher());

drop policy if exists "Teachers update own lessons" on public.teacher_lessons;
create policy "Teachers update own lessons"
  on public.teacher_lessons
  for update
  to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "Teachers delete own lessons" on public.teacher_lessons;
create policy "Teachers delete own lessons"
  on public.teacher_lessons
  for delete
  to authenticated
  using (created_by = auth.uid() or public.is_admin());

grant select, insert, update, delete on table public.teacher_lessons to authenticated;
grant all on table public.teacher_lessons to service_role;

-- ---------------------------------------------------------------------------
-- Storage: lesson-files bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-files',
  'lesson-files',
  true,
  20971520,
  array['application/pdf', 'text/markdown', 'text/plain', 'text/x-markdown']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated can upload lesson files" on storage.objects;
create policy "Authenticated can upload lesson files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'lesson-files');

drop policy if exists "Authenticated can update lesson files" on storage.objects;
create policy "Authenticated can update lesson files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'lesson-files')
  with check (bucket_id = 'lesson-files');

drop policy if exists "Authenticated can select lesson files" on storage.objects;
create policy "Authenticated can select lesson files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'lesson-files');

drop policy if exists "Public can read lesson files" on storage.objects;
create policy "Public can read lesson files"
  on storage.objects
  for select
  to public
  using (bucket_id = 'lesson-files');

drop policy if exists "Admins and teachers can delete lesson files" on storage.objects;
create policy "Admins and teachers can delete lesson files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'lesson-files' and public.is_admin_or_teacher());
