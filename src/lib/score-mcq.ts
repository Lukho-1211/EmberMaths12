import type { AssessmentQuestion } from "@/lib/types";

/**
 * Score on-screen MCQ answers as a 0–100 percent.
 * Unanswered questions count as wrong. Empty question bank → 0.
 */
export function scoreMcq(
  questions: Pick<AssessmentQuestion, "id" | "answerIndex">[],
  answers: Record<string, number>,
): number {
  const total = questions.length;
  if (total === 0) return 0;

  let correct = 0;
  for (const q of questions) {
    if (q.answerIndex === undefined) continue;
    if (answers[q.id] === q.answerIndex) correct += 1;
  }
  return Math.round((correct / total) * 100);
}

/** True when score meets or exceeds the assessment pass mark. */
export function meetsPassMark(score: number, passMark: number): boolean {
  return score >= passMark;
}
