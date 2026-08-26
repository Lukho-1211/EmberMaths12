import { NextResponse } from "next/server";
import { verifyN8nSecret } from "@/lib/generated-video/n8n-config";
import type {
  GeneratedVideoScene,
  GeneratedVideoStatus,
} from "@/lib/generated-video/types";
import {
  patchGeneratedVideo,
  storeGeneratedMp4FromUrl,
} from "@/lib/supabase/generated-video";

const STATUSES: GeneratedVideoStatus[] = [
  "queued",
  "extracting",
  "scripting",
  "rendering",
  "ready",
  "failed",
];

type Body = {
  lessonId?: string;
  status?: GeneratedVideoStatus;
  scenes?: GeneratedVideoScene[];
  heygenVideoId?: string;
  /** Temporary HeyGen CDN URL — Ember downloads and stores in lesson-videos. */
  heygenVideoUrl?: string;
  /** Already-stored public Storage URL (optional if heygenVideoUrl provided). */
  videoUrl?: string;
  error?: string;
};

/**
 * n8n shared-secret callback. Updates job status and optionally stores the mp4.
 */
export async function POST(request: Request) {
  const secret =
    request.headers.get("x-ember-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null;
  if (!verifyN8nSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const lessonId = body.lessonId?.trim() ?? "";
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
  }

  const status = body.status;
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    let videoUrl = body.videoUrl?.trim() || null;
    const heygenVideoUrl = body.heygenVideoUrl?.trim() || null;

    if (heygenVideoUrl && (status === "ready" || !status)) {
      videoUrl = await storeGeneratedMp4FromUrl(lessonId, heygenVideoUrl);
    }

    const job = await patchGeneratedVideo(lessonId, {
      status: status ?? (videoUrl ? "ready" : undefined),
      scenes: body.scenes,
      heygenVideoId: body.heygenVideoId?.trim() || undefined,
      videoUrl: videoUrl ?? undefined,
      error: body.error !== undefined ? body.error : status === "ready" ? null : undefined,
    });

    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Callback failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
