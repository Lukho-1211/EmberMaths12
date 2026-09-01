"use client";

import { useRef, useState } from "react";
import { Film, Trash2, Upload } from "lucide-react";
import { isDirectVideoUrl } from "@/lib/lesson-video/is-direct-video-url";
import { MAX_LESSON_VIDEO_BYTES } from "@/lib/lesson-video/max-video-bytes";
import {
  deleteLessonVideoAsset,
  uploadLessonVideoAsset,
} from "@/lib/supabase/lesson-videos";

function isMp4File(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".mp4") || file.type === "video/mp4";
}

export function UploadLessonVideoPanel({
  lessonId,
  videoUrl,
  onVideoUrlChange,
}: {
  lessonId: string;
  videoUrl: string;
  /** Persist the new URL (or empty string to clear a hosted mp4). */
  onVideoUrlChange: (nextUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasHosted = isDirectVideoUrl(videoUrl);
  const storagePath = `${lessonId}/lesson.mp4`;

  async function onFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    setError(null);
    if (!isMp4File(file)) {
      setError("Only MP4 video files are supported.");
      return;
    }
    if (file.size > MAX_LESSON_VIDEO_BYTES) {
      setError(
        `File is too large (max ${(MAX_LESSON_VIDEO_BYTES / (1024 * 1024)).toFixed(0)} MB).`,
      );
      return;
    }

    setBusy(true);
    try {
      const uploaded = await uploadLessonVideoAsset(file, storagePath, "video/mp4");
      if ("error" in uploaded) {
        setError(uploaded.error);
        return;
      }
      // Cache-bust so replace shows the new file immediately.
      const next = `${uploaded.url}${uploaded.url.includes("?") ? "&" : "?"}t=${Date.now()}`;
      onVideoUrlChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video.");
    } finally {
      setBusy(false);
    }
  }

  async function removeVideo() {
    setError(null);
    setBusy(true);
    try {
      const removed = await deleteLessonVideoAsset(storagePath);
      if ("error" in removed) {
        // Still clear the curriculum URL even if Storage delete fails (object may be absent).
        console.warn("lesson-videos delete:", removed.error);
      }
      onVideoUrlChange("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Lesson video</p>
          <p className="text-xs text-muted">
            Upload an MP4 made outside Ember. Students see this on the Video tab first; otherwise
            the PDF/Markdown slideshow. Max{" "}
            {(MAX_LESSON_VIDEO_BYTES / (1024 * 1024)).toFixed(0)} MB.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-ember-gold px-3 py-1.5 text-xs font-bold text-ember-navy disabled:opacity-60">
          <Upload size={14} />
          {busy ? "Uploading…" : hasHosted ? "Replace video" : "Upload video"}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,.mp4"
            className="sr-only"
            disabled={busy}
            onChange={(e) => void onFileSelected(e.target.files)}
          />
        </label>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {hasHosted ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <Film size={16} className="shrink-0 text-ember-navy" />
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-sm font-medium text-ember-navy underline-offset-2 hover:underline"
            >
              Hosted MP4 ready
            </a>
          </div>
          <button
            type="button"
            onClick={() => void removeVideo()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded p-1.5 text-xs text-muted hover:bg-ember-gray hover:text-ember-navy disabled:opacity-60"
            aria-label="Remove lesson video"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">No hosted video yet.</p>
      )}
    </div>
  );
}
