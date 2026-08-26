"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import type { LessonGeneratedVideo } from "@/lib/generated-video/types";
import { MAX_VIDEO_PDF_PAGES } from "@/lib/generated-video/types";
import { rasterizePdfForVideo } from "@/lib/lesson-video/rasterize-pdf-for-video";
import {
  dataUrlToBlob,
  uploadLessonVideoAsset,
} from "@/lib/supabase/lesson-videos";
import type { Resource } from "@/lib/types";

const POLL_MS = 4000;
/** After this long still on "queued", n8n almost certainly never reached the callback. */
const QUEUED_STUCK_MS = 15_000;

function statusLabel(status: LessonGeneratedVideo["status"]): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "extracting":
      return "Extracting math & text…";
    case "scripting":
      return "Writing narration scenes…";
    case "rendering":
      return "Rendering HeyGen avatar…";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function isInFlight(status: LessonGeneratedVideo["status"]): boolean {
  return (
    status === "queued" ||
    status === "extracting" ||
    status === "scripting" ||
    status === "rendering"
  );
}

function pickPdfResource(resources: Resource[]): Resource | null {
  return (
    resources.find(
      (r) =>
        r.type === "pdf" &&
        (r.url.startsWith("http://") ||
          r.url.startsWith("https://") ||
          r.url.startsWith("data:")),
    ) ?? null
  );
}

export function GenerateExplainerVideoPanel({
  termId,
  weekId,
  lessonId,
  resources,
}: {
  termId: string;
  weekId: string;
  lessonId: string;
  resources: Resource[];
}) {
  const [job, setJob] = useState<LessonGeneratedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queuedStuck, setQueuedStuck] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queuedSinceRef = useRef<number | null>(null);

  const pdf = pickPdfResource(resources);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/lessons/${encodeURIComponent(lessonId)}/generated-video`);
      const data = (await res.json()) as { job?: LessonGeneratedVideo | null; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not load video status.");
        return;
      }
      const next = data.job ?? null;
      setJob(next);
      setError(null);
      if (next?.status === "queued") {
        if (queuedSinceRef.current == null) {
          queuedSinceRef.current = Date.now();
        }
        if (Date.now() - queuedSinceRef.current >= QUEUED_STUCK_MS) {
          setQueuedStuck(true);
          setNote(
            "Still queued — n8n has not reached the Ember callback. Check the n8n execution, or generate from a public host (production or tunnel).",
          );
        }
      } else {
        queuedSinceRef.current = null;
        setQueuedStuck(false);
        if (next && next.status !== "failed") {
          setNote(null);
        }
      }
      if (next && !isInFlight(next.status)) {
        stopPoll();
      }
    } catch {
      setError("Could not load video status.");
    } finally {
      setLoading(false);
    }
  }, [lessonId, stopPoll]);

  useEffect(() => {
    setLoading(true);
    setJob(null);
    setNote(null);
    setError(null);
    setQueuedStuck(false);
    queuedSinceRef.current = null;
    stopPoll();
    void fetchJob();
    return stopPoll;
  }, [lessonId, fetchJob, stopPoll]);

  useEffect(() => {
    if (!job || !isInFlight(job.status)) return;
    stopPoll();
    pollRef.current = setInterval(() => {
      void fetchJob();
    }, POLL_MS);
    return stopPoll;
  }, [job?.status, job?.id, fetchJob, stopPoll, job]);

  async function generate() {
    if (!pdf) {
      setError("Upload a PDF lesson material before generating a video.");
      return;
    }
    setBusy(true);
    setError(null);
    setNote("Rasterizing PDF pages…");
    try {
      const raster = await rasterizePdfForVideo(pdf);
      if (raster.pages.length === 0) {
        throw new Error("No pages could be read from this PDF.");
      }

      setNote(
        raster.truncated
          ? `Uploading first ${MAX_VIDEO_PDF_PAGES} of ${raster.totalPages} pages…`
          : `Uploading ${raster.pages.length} page image(s)…`,
      );

      const pageImageUrls: string[] = [];
      const extractedText: string[] = [];
      for (const page of raster.pages) {
        const blob = await dataUrlToBlob(page.imageDataUrl);
        const path = `${lessonId}/pages/page-${String(page.pageNum).padStart(2, "0")}.jpg`;
        const uploaded = await uploadLessonVideoAsset(blob, path, "image/jpeg");
        if ("error" in uploaded) {
          throw new Error(uploaded.error);
        }
        pageImageUrls.push(uploaded.url);
        extractedText.push(page.text);
      }

      setNote("Queuing HeyGen pipeline…");
      const res = await fetch("/api/lessons/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termId,
          weekId,
          lessonId,
          resourceId: pdf.id,
          pdfUrl: pdf.url,
          pageImageUrls,
          extractedText,
          truncated: raster.truncated,
        }),
      });
      const data = (await res.json()) as {
        job?: LessonGeneratedVideo;
        error?: string;
      };
      if (!res.ok || !data.job) {
        throw new Error(data.error ?? "Failed to queue video generation.");
      }
      setJob(data.job);
      queuedSinceRef.current = Date.now();
      setQueuedStuck(false);
      setNote(
        raster.truncated
          ? `Queued (using first ${MAX_VIDEO_PDF_PAGES} pages of ${raster.totalPages}).`
          : "Queued — pipeline is running.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video generation failed.");
      setNote(null);
    } finally {
      setBusy(false);
    }
  }

  const inFlight = job ? isInFlight(job.status) : false;

  return (
    <div className="mt-3 rounded-lg border border-border bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Explainer video (HeyGen)</p>
          <p className="text-xs text-muted">
            Manual generate — talking-head avatar explaining this lesson PDF. Students see the
            mp4 when ready; otherwise the slide walkthrough.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={busy || inFlight || !pdf}
          className="inline-flex items-center gap-2 rounded-md bg-ember-gold px-3 py-1.5 text-xs font-bold text-ember-navy disabled:opacity-60"
        >
          {busy || inFlight ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Clapperboard size={14} />
          )}
          {busy
            ? "Preparing…"
            : inFlight
              ? "Generating…"
              : job?.status === "ready"
                ? "Regenerate video"
                : "Generate explainer video"}
        </button>
      </div>

      {loading ? (
        <p className="mt-2 text-xs text-muted">Loading video status…</p>
      ) : null}

      {!loading && job ? (
        <p className="mt-2 text-xs" role="status">
          <span
            className={
              job.status === "ready"
                ? "font-semibold text-success"
                : job.status === "failed"
                  ? "font-semibold text-danger"
                  : "font-semibold text-ember-navy"
            }
          >
            {statusLabel(job.status)}
          </span>
          {job.videoUrl && job.status === "ready" ? (
            <>
              {" · "}
              <a
                href={job.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-ember-gold"
              >
                Open mp4
              </a>
            </>
          ) : null}
          {job.error ? <span className="block text-danger">{job.error}</span> : null}
        </p>
      ) : null}

      {!loading && !job && !pdf ? (
        <p className="mt-2 text-xs text-muted">Upload a PDF to enable video generation.</p>
      ) : null}

      {note ? (
        <p
          className={`mt-2 text-xs ${queuedStuck ? "text-danger" : "text-muted"}`}
          role="status"
        >
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
