-- ---------------------------------------------------------------------------
-- Generated lesson videos (HeyGen explainer pipeline)
-- One active row per lesson_id; regenerate overwrites.
-- ---------------------------------------------------------------------------

create table if not exists public.lesson_generated_videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null,
  term_id text not null,
  week_id text not null,
  resource_id text not null,
  status text not null
    check (status in (
      'queued',
      'extracting',
      'scripting',
      'rendering',
      'ready',
      'failed'
    )),
  source_pdf_url text not null,
  page_image_urls jsonb not null default '[]'::jsonb,
  scenes jsonb,
  heygen_video_id text,
  video_url text,
  error text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id)
);

create index if not exists lesson_generated_videos_status_idx
  on public.lesson_generated_videos (status);

create index if not exists lesson_generated_videos_lesson_id_idx
  on public.lesson_generated_videos (lesson_id);

alter table public.lesson_generated_videos enable row level security;

drop policy if exists "Admins manage generated videos" on public.lesson_generated_videos;
create policy "Admins manage generated videos"
  on public.lesson_generated_videos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Students and teachers read ready videos" on public.lesson_generated_videos;
create policy "Students and teachers read ready videos"
  on public.lesson_generated_videos
  for select
  to authenticated
  using (
    status = 'ready'
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('student', 'teacher', 'admin')
    )
  );

grant select, insert, update, delete on table public.lesson_generated_videos to authenticated;
grant all on table public.lesson_generated_videos to service_role;

-- ---------------------------------------------------------------------------
-- Storage: lesson-videos bucket (mp4 + page JPEG/PNG backgrounds)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-videos',
  'lesson-videos',
  true,
  209715200,
  array[
    'video/mp4',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload lesson videos" on storage.objects;
create policy "Admins can upload lesson videos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'lesson-videos' and public.is_admin());

drop policy if exists "Admins can update lesson videos" on storage.objects;
create policy "Admins can update lesson videos"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'lesson-videos' and public.is_admin())
  with check (bucket_id = 'lesson-videos' and public.is_admin());

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
  using (bucket_id = 'lesson-videos' and public.is_admin());
