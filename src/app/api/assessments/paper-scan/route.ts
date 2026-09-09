import { NextResponse } from "next/server";
import { findAssessment } from "@/lib/domain";
import { gradeWeekTestScan, questionHintsForPaperScan } from "@/lib/grade-week-test-scan";
import { mockPaperGrade } from "@/lib/mock-paper-grade";
import {
  insertCorrectionServer,
  loadCurriculumServer,
  loadProgressServer,
  upsertProgressServer,
} from "@/lib/supabase/progress-server";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";
import type { CorrectionResult } from "@/lib/types";

/** Gemini memo marking often takes ~60s; Hobby/Fluid max is 300s. Do not cap at 60. */
export const maxDuration = 300;

type Body = {
  assessmentId?: string;
  fileName?: string;
  /** Private Storage path under student-scans (required for week tests). */
  scanPath?: string;
  /** When true (or assessment is a past paper), do not update pass/fail scores. */
  practiceOnly?: boolean;
  correctionMode?: "paper-scan" | "past-paper";
};

/**
 * Paper-scan grading.
 * - Saturday week tests: real Gemini marking against the admin memo (scan in Storage).
 * - Other assessments: deterministic mock (filename only) until L2 expands.
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

    let score: number;
    let feedback: string[];
    let summary: string;
    let questionFeedback: CorrectionResult["questionFeedback"];

    if (found.kind === "weekTest") {
      const scanPath = body.scanPath?.trim() ?? "";
      if (!scanPath) {
        return NextResponse.json(
          { error: "scanPath is required for Saturday week tests." },
          { status: 400 },
        );
      }
      const expectedPrefix = `${auth.id}/`;
      if (!scanPath.startsWith(expectedPrefix) || scanPath.includes("..")) {
        return NextResponse.json({ error: "Invalid scan path." }, { status: 400 });
      }
      if (!found.memoResources.length) {
        return NextResponse.json(
          {
            error:
              "No week test memo uploaded. Ask your admin to add a memo under Admin → Terms.",
          },
          { status: 400 },
        );
      }
      if (!process.env.GEMINI_API_KEY?.trim()) {
        return NextResponse.json(
          {
            error:
              "Week test marking is not configured (GEMINI_API_KEY missing on the server).",
          },
          { status: 503 },
        );
      }

      try {
        const graded = await gradeWeekTestScan({
          assessmentId: found.id,
          assessmentTitle: found.title,
          passMark: found.passMark,
          memoResources: found.memoResources,
          scanPath,
          fileName,
          questions: questionHintsForPaperScan(
            found.questions.map((q) => ({ id: q.id, prompt: q.prompt })),
          ),
        });
        score = graded.score;
        feedback = graded.feedback;
        summary = graded.summary;
        questionFeedback = graded.questionFeedback;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Week test grading failed.";
        if (message.includes("GEMINI_API_KEY")) {
          return NextResponse.json({ error: message }, { status: 503 });
        }
        if (
          message.includes("memo") ||
          message.includes("scan") ||
          message.includes("download")
        ) {
          return NextResponse.json({ error: message }, { status: 400 });
        }
        throw err;
      }
    } else {
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
      score = graded.score;
      feedback = graded.feedback;
      summary = graded.summary;
      questionFeedback = graded.questionFeedback;
    }

    const correction: CorrectionResult = {
      id: crypto.randomUUID(),
      studentId: auth.id,
      fileName,
      score,
      feedback,
      summary,
      createdAt: new Date().toISOString(),
      assessmentId: found.id,
      assessmentTitle: found.title,
      mode: correctionMode,
      questionFeedback,
    };

    await insertCorrectionServer(correction);

    let progress = undefined;
    if (!practiceOnly) {
      const current = await loadProgressServer(auth.id);
      progress = await upsertProgressServer({
        ...current,
        testScores: { ...current.testScores, [assessmentId]: score },
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
