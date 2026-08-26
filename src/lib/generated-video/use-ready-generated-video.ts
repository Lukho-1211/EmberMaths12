"use client";

import { useEffect, useState } from "react";
import type { LessonGeneratedVideo } from "@/lib/generated-video/types";

/**
 * Load a ready generated explainer mp4 for a lesson (students/teachers/admins).
 * Returns null while loading or when no ready video exists.
 */
export function useReadyGeneratedVideo(lessonId: string | undefined) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(lessonId));

  useEffect(() => {
    if (!lessonId) {
      setVideoUrl(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setVideoUrl(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/lessons/${encodeURIComponent(lessonId)}/generated-video`,
        );
        const data = (await res.json()) as { job?: LessonGeneratedVideo | null };
        if (cancelled) return;
        if (
          res.ok &&
          data.job?.status === "ready" &&
          typeof data.job.videoUrl === "string" &&
          data.job.videoUrl.length > 0
        ) {
          setVideoUrl(data.job.videoUrl);
        } else {
          setVideoUrl(null);
        }
      } catch {
        if (!cancelled) setVideoUrl(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  return { videoUrl, loading };
}
