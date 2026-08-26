import { createAdminClient } from "@/lib/supabase/admin";
import {
  GENERATED_VIDEO_SELECT,
  mapGeneratedVideoRow,
} from "@/lib/generated-video/map-row";
import type {
  GeneratedVideoScene,
  GeneratedVideoStatus,
  LessonGeneratedVideo,
} from "@/lib/generated-video/types";

export async function getGeneratedVideoByLessonId(
  lessonId: string,
): Promise<LessonGeneratedVideo | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_generated_videos")
    .select(GENERATED_VIDEO_SELECT)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapGeneratedVideoRow(data);
}

export async function upsertQueuedGeneratedVideo(input: {
  lessonId: string;
  termId: string;
  weekId: string;
  resourceId: string;
  sourcePdfUrl: string;
  pageImageUrls: string[];
  createdBy: string;
}): Promise<LessonGeneratedVideo> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("lesson_generated_videos")
    .upsert(
      {
        lesson_id: input.lessonId,
        term_id: input.termId,
        week_id: input.weekId,
        resource_id: input.resourceId,
        status: "queued" as GeneratedVideoStatus,
        source_pdf_url: input.sourcePdfUrl,
        page_image_urls: input.pageImageUrls,
        scenes: null,
        heygen_video_id: null,
        video_url: null,
        error: null,
        created_by: input.createdBy,
        updated_at: now,
      },
      { onConflict: "lesson_id" },
    )
    .select(GENERATED_VIDEO_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapGeneratedVideoRow(data);
}

export async function patchGeneratedVideo(
  lessonId: string,
  patch: {
    status?: GeneratedVideoStatus;
    scenes?: GeneratedVideoScene[] | null;
    heygenVideoId?: string | null;
    videoUrl?: string | null;
    error?: string | null;
    pageImageUrls?: string[];
  },
): Promise<LessonGeneratedVideo> {
  const admin = createAdminClient();
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.scenes !== undefined) payload.scenes = patch.scenes;
  if (patch.heygenVideoId !== undefined) payload.heygen_video_id = patch.heygenVideoId;
  if (patch.videoUrl !== undefined) payload.video_url = patch.videoUrl;
  if (patch.error !== undefined) payload.error = patch.error;
  if (patch.pageImageUrls !== undefined) payload.page_image_urls = patch.pageImageUrls;

  const { data, error } = await admin
    .from("lesson_generated_videos")
    .update(payload)
    .eq("lesson_id", lessonId)
    .select(GENERATED_VIDEO_SELECT)
    .single();
  if (error) throw new Error(error.message);
  return mapGeneratedVideoRow(data);
}

/**
 * Download a remote mp4 and store it in the lesson-videos bucket.
 * Used by the n8n callback so the service role never leaves Ember.
 */
export async function storeGeneratedMp4FromUrl(
  lessonId: string,
  remoteUrl: string,
): Promise<string> {
  const res = await fetch(remoteUrl);
  if (!res.ok) {
    throw new Error(`Failed to download HeyGen video (${res.status}).`);
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  const path = `${lessonId}/explainer.mp4`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from("lesson-videos").upload(path, bytes, {
    upsert: true,
    contentType: "video/mp4",
  });
  if (error) throw new Error(error.message);
  const { data } = admin.storage.from("lesson-videos").getPublicUrl(path);
  return data.publicUrl;
}
