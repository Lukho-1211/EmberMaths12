import { NextResponse } from "next/server";
import {
  callbackBaseUrl,
  n8nWebhookSecret,
  n8nWebhookUrl,
} from "@/lib/generated-video/n8n-config";
import { MAX_VIDEO_PDF_PAGES } from "@/lib/generated-video/types";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";
import {
  patchGeneratedVideo,
  upsertQueuedGeneratedVideo,
} from "@/lib/supabase/generated-video";

type Body = {
  termId?: string;
  weekId?: string;
  lessonId?: string;
  resourceId?: string;
  pdfUrl?: string;
  pageImageUrls?: string[];
  extractedText?: string[];
  truncated?: boolean;
};

/**
 * Admin: queue a HeyGen explainer job and kick n8n.
 */
export async function POST(request: Request) {
  const auth = await requireUser(["admin"]);
  if (!isAuthedUser(auth)) return auth;

  const webhookUrl = n8nWebhookUrl();
  const webhookSecret = n8nWebhookSecret();
  if (!webhookUrl || !webhookSecret) {
    return NextResponse.json(
      {
        error:
          "Video generation is not configured. Set N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET.",
      },
      { status: 503 },
    );
  }

  const base = callbackBaseUrl(request);
  if (!base.ok) {
    return NextResponse.json({ error: base.error }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const termId = body.termId?.trim() ?? "";
  const weekId = body.weekId?.trim() ?? "";
  const lessonId = body.lessonId?.trim() ?? "";
  const resourceId = body.resourceId?.trim() ?? "";
  const pdfUrl = body.pdfUrl?.trim() ?? "";
  const pageImageUrls = Array.isArray(body.pageImageUrls)
    ? body.pageImageUrls.filter((u): u is string => typeof u === "string" && u.length > 0)
    : [];
  const extractedText = Array.isArray(body.extractedText)
    ? body.extractedText.map((t) => (typeof t === "string" ? t : ""))
    : [];

  if (!termId || !weekId || !lessonId || !resourceId || !pdfUrl) {
    return NextResponse.json(
      { error: "termId, weekId, lessonId, resourceId, and pdfUrl are required." },
      { status: 400 },
    );
  }
  if (pageImageUrls.length === 0) {
    return NextResponse.json(
      { error: "pageImageUrls must include at least one page image." },
      { status: 400 },
    );
  }
  if (pageImageUrls.length > MAX_VIDEO_PDF_PAGES) {
    return NextResponse.json(
      { error: `At most ${MAX_VIDEO_PDF_PAGES} pages are allowed.` },
      { status: 400 },
    );
  }

  try {
    const job = await upsertQueuedGeneratedVideo({
      lessonId,
      termId,
      weekId,
      resourceId,
      sourcePdfUrl: pdfUrl,
      pageImageUrls,
      createdBy: auth.id,
    });

    const callbackUrl = `${base.baseUrl}/api/lessons/generated-video/callback`;
    const webhookPayload = {
      jobId: job.id,
      lessonId,
      termId,
      weekId,
      resourceId,
      pdfUrl,
      pageImageUrls,
      extractedText,
      truncated: Boolean(body.truncated),
      callbackUrl,
      secret: webhookSecret,
    };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ember-Secret": webhookSecret,
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookRes.ok) {
      const detail = await webhookRes.text().catch(() => "");
      const message = `n8n webhook failed (${webhookRes.status}). ${detail.slice(0, 200)}`;
      const failedJob = await patchGeneratedVideo(lessonId, {
        status: "failed",
        error: message,
      });
      return NextResponse.json({ error: message, job: failedJob }, { status: 502 });
    }

    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to queue video job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
