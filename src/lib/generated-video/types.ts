export type GeneratedVideoStatus =
  | "queued"
  | "extracting"
  | "scripting"
  | "rendering"
  | "ready"
  | "failed";

export interface GeneratedVideoScene {
  spokenScript: string;
  latex?: string;
  pageImageUrl: string;
  visualHint?: string;
}

export interface LessonGeneratedVideo {
  id: string;
  lessonId: string;
  termId: string;
  weekId: string;
  resourceId: string;
  status: GeneratedVideoStatus;
  sourcePdfUrl: string;
  pageImageUrls: string[];
  scenes: GeneratedVideoScene[] | null;
  heygenVideoId: string | null;
  videoUrl: string | null;
  error: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Cost guard: max PDF pages sent into the pipeline. */
export const MAX_VIDEO_PDF_PAGES = 12;

/** Cost guard: max HeyGen scenes. */
export const MAX_VIDEO_SCENES = 8;
