-- ---------------------------------------------------------------------------
-- Remove HeyGen/n8n generated-video job table.
-- Lesson mp4s are uploaded by admins into Storage bucket lesson-videos and
-- referenced via curriculum Lesson.videoUrl.
-- ---------------------------------------------------------------------------

drop policy if exists "Admins manage generated videos" on public.lesson_generated_videos;
drop policy if exists "Students and teachers read ready videos" on public.lesson_generated_videos;

drop table if exists public.lesson_generated_videos;

-- Restrict lesson-videos to mp4 only (page JPEGs were pipeline-only).
update storage.buckets
set
  allowed_mime_types = array['video/mp4'],
  file_size_limit = 209715200
where id = 'lesson-videos';
