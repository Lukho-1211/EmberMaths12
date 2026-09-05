import type { StudentProgress } from "@/lib/types";

/**
 * Recompute overallPercent, pass/fail status, and badge ids from lesson
 * completions and stored test scores. Same formula as the former store helper.
 */
export function recomputeProgress(progress: StudentProgress): StudentProgress {
  const lessonCount = Math.max(progress.completedLessonIds.length, 1);
  const scores = Object.values(progress.testScores);
  const avgScore =
    scores.length === 0
      ? progress.completedLessonIds.length * 4
      : scores.reduce((a, b) => a + b, 0) / scores.length;
  const overall = Math.min(
    100,
    Math.round(avgScore * 0.7 + Math.min(100, lessonCount * 3) * 0.3),
  );
  const status =
    scores.length === 0 && progress.completedLessonIds.length === 0
      ? "pending"
      : overall >= 50
        ? "passing"
        : "failing";
  const badgeIds = new Set(progress.badgeIds);
  if (progress.completedLessonIds.length >= 1) badgeIds.add("badge-starter");
  if (progress.completedLessonIds.length >= 5) badgeIds.add("badge-week");
  if (scores.some((s) => s >= 50)) badgeIds.add("badge-test");
  if (
    Object.keys(progress.testScores).some(
      (k) => k.startsWith("preexam-") && (progress.testScores[k] ?? 0) >= 50,
    )
  ) {
    badgeIds.add("badge-preexam");
  }
  if (overall >= 60) badgeIds.add("badge-streak");
  return {
    ...progress,
    overallPercent: overall,
    status,
    badgeIds: Array.from(badgeIds),
  };
}

export function emptyStudentProgress(studentId: string): StudentProgress {
  return {
    studentId,
    completedLessonIds: [],
    testScores: {},
    badgeIds: [],
    overallPercent: 0,
    status: "pending",
  };
}
