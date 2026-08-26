import type {
  GeneratedVideoScene,
  GeneratedVideoStatus,
  LessonGeneratedVideo,
} from "@/lib/generated-video/types";

type DbRow = {
  id: string;
  lesson_id: string;
  term_id: string;
  week_id: string;
  resource_id: string;
  status: GeneratedVideoStatus;
  source_pdf_url: string;
  page_image_urls: unknown;
  scenes: unknown;
  heygen_video_id: string | null;
  video_url: string | null;
  error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asScenes(value: unknown): GeneratedVideoScene[] | null {
  if (!Array.isArray(value)) return null;
  const scenes: GeneratedVideoScene[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.spokenScript !== "string" || typeof row.pageImageUrl !== "string") {
      continue;
    }
    scenes.push({
      spokenScript: row.spokenScript,
      pageImageUrl: row.pageImageUrl,
      latex: typeof row.latex === "string" ? row.latex : undefined,
      visualHint: typeof row.visualHint === "string" ? row.visualHint : undefined,
    });
  }
  return scenes;
}

export function mapGeneratedVideoRow(row: DbRow): LessonGeneratedVideo {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    termId: row.term_id,
    weekId: row.week_id,
    resourceId: row.resource_id,
    status: row.status,
    sourcePdfUrl: row.source_pdf_url,
    pageImageUrls: asStringArray(row.page_image_urls),
    scenes: asScenes(row.scenes),
    heygenVideoId: row.heygen_video_id,
    videoUrl: row.video_url,
    error: row.error,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const GENERATED_VIDEO_SELECT =
  "id, lesson_id, term_id, week_id, resource_id, status, source_pdf_url, page_image_urls, scenes, heygen_video_id, video_url, error, created_by, created_at, updated_at";
