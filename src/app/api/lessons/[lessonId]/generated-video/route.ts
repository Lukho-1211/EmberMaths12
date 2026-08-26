import { NextResponse } from "next/server";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";
import { getGeneratedVideoByLessonId } from "@/lib/supabase/generated-video";

type Params = { params: Promise<{ lessonId: string }> };

/**
 * Poll generated-video job for a lesson.
 * Admins see all statuses; students/teachers only ready rows (RLS + filter).
 */
export async function GET(_request: Request, { params }: Params) {
  const auth = await requireUser(["admin", "student", "teacher"]);
  if (!isAuthedUser(auth)) return auth;

  const { lessonId: raw } = await params;
  const lessonId = raw?.trim() ?? "";
  if (!lessonId) {
    return NextResponse.json({ error: "lessonId is required." }, { status: 400 });
  }

  try {
    const job = await getGeneratedVideoByLessonId(lessonId);
    if (!job) {
      return NextResponse.json({ job: null });
    }
    if (auth.role !== "admin" && job.status !== "ready") {
      return NextResponse.json({ job: null });
    }
    return NextResponse.json({ job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
