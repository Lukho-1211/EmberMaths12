import { NextResponse } from "next/server";
import { canCompleteLesson, findLesson } from "@/lib/domain";
import {
  loadCurriculumServer,
  loadProgressServer,
  upsertProgressServer,
} from "@/lib/supabase/progress-server";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";

type Body = {
  lessonId?: string;
};

/**
 * Mark a day lesson complete. Gated on passing lessonTest when one exists.
 * Session user is the student.
 */
export async function POST(request: Request) {
  const auth = await requireUser(["student"]);
  if (!isAuthedUser(auth)) return auth;

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

  try {
    const { terms } = await loadCurriculumServer();
    const lesson = findLesson(terms, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const current = await loadProgressServer(auth.id);
    if (current.completedLessonIds.includes(lessonId)) {
      return NextResponse.json({ ok: true, progress: current, alreadyComplete: true });
    }

    const gate = canCompleteLesson(lesson, current.testScores);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: 400 });
    }

    const progress = await upsertProgressServer({
      ...current,
      completedLessonIds: [...current.completedLessonIds, lessonId],
    });

    return NextResponse.json({ ok: true, progress, alreadyComplete: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Complete lesson failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
