import { NextResponse } from "next/server";
import { findAssessment } from "@/lib/domain";
import { mockPaperGrade } from "@/lib/mock-paper-grade";
import {
  insertCorrectionServer,
  loadCurriculumServer,
  loadProgressServer,
  upsertProgressServer,
} from "@/lib/supabase/progress-server";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";
import type { CorrectionResult } from "@/lib/types";

type Body = {
  assessmentId?: string;
  fileName?: string;
  /** When true (or assessment is a past paper), do not update pass/fail scores. */
  practiceOnly?: boolean;
  correctionMode?: "paper-scan" | "past-paper";
};

/**
 * Deterministic mock paper grading (not real OCR). Writes corrections via
 * service role; updates test_scores only when not practice/past-paper.
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
  const fileName = body.fileName?.trim() ?? "";
  if (!assessmentId || !fileName) {
    return NextResponse.json(
      { error: "assessmentId and fileName are required." },
      { status: 400 },
    );
  }

  try {
    const { terms } = await loadCurriculumServer();
    const found = findAssessment(terms, assessmentId);
    if (!found) {
      return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
    }

    const practiceOnly =
      Boolean(body.practiceOnly) || found.practiceOnly || found.kind === "pastPaper";
    const correctionMode =
      body.correctionMode ?? (found.kind === "pastPaper" ? "past-paper" : "paper-scan");

    const questions = found.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      answerIndex: q.answerIndex ?? 0,
    }));

    const graded = mockPaperGrade({
      assessmentId: found.id,
      assessmentTitle: found.title,
      questions,
      fileName,
      passMark: found.passMark,
      memoResources: found.memoResources,
    });

    const correction: CorrectionResult = {
      id: crypto.randomUUID(),
      studentId: auth.id,
      fileName,
      score: graded.score,
      feedback: graded.feedback,
      summary: graded.summary,
      createdAt: new Date().toISOString(),
      assessmentId: found.id,
      assessmentTitle: found.title,
      mode: correctionMode,
      questionFeedback: graded.questionFeedback,
    };

    await insertCorrectionServer(correction);

    let progress = undefined;
    if (!practiceOnly) {
      const current = await loadProgressServer(auth.id);
      progress = await upsertProgressServer({
        ...current,
        testScores: { ...current.testScores, [assessmentId]: graded.score },
      });
    }

    return NextResponse.json({
      ok: true,
      correction,
      progress: progress ?? null,
      practiceOnly,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Paper scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
