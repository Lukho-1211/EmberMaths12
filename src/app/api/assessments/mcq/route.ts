import { NextResponse } from "next/server";
import { findAssessment } from "@/lib/domain";
import { meetsPassMark, scoreMcq } from "@/lib/score-mcq";
import {
  loadCurriculumServer,
  loadProgressServer,
  upsertProgressServer,
} from "@/lib/supabase/progress-server";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";

type Body = {
  assessmentId?: string;
  answers?: Record<string, number>;
};

/**
 * Score on-screen MCQ against curriculum answer keys (server-only).
 * Session user is the student — client studentId is ignored.
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

  const assessmentId = body.assessmentId?.trim() ?? "";
  const answers = body.answers ?? {};
  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required." }, { status: 400 });
  }

  try {
    const { terms } = await loadCurriculumServer();
    const found = findAssessment(terms, assessmentId);
    if (!found) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }
    if (found.practiceOnly || found.kind === "pastPaper") {
      return NextResponse.json(
        {
          error:
            "Past papers are practice-only. Use paper + scan; they do not update pass/fail.",
        },
        { status: 400 },
      );
    }
    if (found.questions.length === 0) {
      return NextResponse.json(
        { error: "This assessment has no MCQ questions." },
        { status: 400 },
      );
    }

    const scoredQuestions = found.questions.filter(
      (q): q is typeof q & { answerIndex: number } => typeof q.answerIndex === "number",
    );
    if (scoredQuestions.length === 0) {
      return NextResponse.json(
        { error: "Assessment answer keys are missing." },
        { status: 500 },
      );
    }

    const score = scoreMcq(scoredQuestions, answers);
    const passed = meetsPassMark(score, found.passMark);

    const current = await loadProgressServer(auth.id);
    const progress = await upsertProgressServer({
      ...current,
      testScores: { ...current.testScores, [assessmentId]: score },
    });

    return NextResponse.json({ ok: true, score, passed, progress });
  } catch (err) {
    const message = err instanceof Error ? err.message : "MCQ submit failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
