import { describe, expect, it } from "vitest";
import {
  canCompleteLesson,
  findAssessment,
  findLesson,
  recomputeProgress,
  stripCurriculumSecrets,
} from "@/lib/domain";
import { SEED_TERMS } from "@/lib/mock/curriculum";
import type { Lesson, StudentProgress } from "@/lib/types";

function baseProgress(overrides: Partial<StudentProgress> = {}): StudentProgress {
  return {
    studentId: "student-1",
    completedLessonIds: [],
    testScores: {},
    badgeIds: [],
    overallPercent: 0,
    status: "pending",
    ...overrides,
  };
}

describe("recomputeProgress", () => {
  it("stays pending with no lessons and no scores", () => {
    const result = recomputeProgress(baseProgress());
    expect(result.status).toBe("pending");
    // Formula uses max(lessonCount, 1) so empty progress still yields a small overall.
    expect(result.overallPercent).toBeGreaterThanOrEqual(0);
    expect(result.badgeIds).toEqual([]);
  });

  it("awards First Spark and computes overall from lessons only", () => {
    const result = recomputeProgress(
      baseProgress({ completedLessonIds: ["lesson-a"] }),
    );
    expect(result.badgeIds).toContain("badge-starter");
    expect(result.status).not.toBe("pending");
    expect(result.overallPercent).toBeGreaterThan(0);
  });

  it("awards Week Warrior at 5 completed lessons", () => {
    const result = recomputeProgress(
      baseProgress({
        completedLessonIds: ["a", "b", "c", "d", "e"],
        testScores: { "test-1": 80 },
      }),
    );
    expect(result.badgeIds).toContain("badge-week");
    expect(result.badgeIds).toContain("badge-test");
  });

  it("awards Term Ready when a preexam score is >= 50", () => {
    const result = recomputeProgress(
      baseProgress({
        completedLessonIds: ["a"],
        testScores: { "preexam-t1": 55 },
      }),
    );
    expect(result.badgeIds).toContain("badge-preexam");
  });

  it("marks failing when overall is below 50", () => {
    const result = recomputeProgress(
      baseProgress({
        completedLessonIds: [],
        testScores: { "test-1": 10 },
      }),
    );
    expect(result.status).toBe("failing");
  });

  it("marks passing when overall is >= 50", () => {
    const result = recomputeProgress(
      baseProgress({
        completedLessonIds: ["a", "b", "c"],
        testScores: { "test-1": 80, "test-2": 70 },
      }),
    );
    expect(result.status).toBe("passing");
    expect(result.overallPercent).toBeGreaterThanOrEqual(50);
  });
});

describe("findAssessment / findLesson", () => {
  it("finds a week test", () => {
    const found = findAssessment(SEED_TERMS, "test-t1-w1");
    expect(found).not.toBeNull();
    expect(found!.kind).toBe("weekTest");
    expect(found!.practiceOnly).toBe(false);
    expect(found!.questions.length).toBeGreaterThan(0);
  });

  it("finds a lesson test with parent lesson", () => {
    const lesson = SEED_TERMS[0]!.weeks[0]!.lessons[0]!;
    const testId = lesson.lessonTest!.id;
    const found = findAssessment(SEED_TERMS, testId);
    expect(found).not.toBeNull();
    expect(found!.kind).toBe("lessonTest");
    expect(found!.lesson?.id).toBe(lesson.id);
  });

  it("finds a pre-exam", () => {
    const found = findAssessment(SEED_TERMS, "preexam-t1");
    expect(found?.kind).toBe("preExam");
    expect(found?.practiceOnly).toBe(false);
  });

  it("marks past papers as practiceOnly", () => {
    const found = findAssessment(SEED_TERMS, "pastpaper-t1");
    expect(found?.kind).toBe("pastPaper");
    expect(found?.practiceOnly).toBe(true);
  });

  it("returns null for unknown assessment ids", () => {
    expect(findAssessment(SEED_TERMS, "nope")).toBeNull();
  });

  it("finds a lesson by id", () => {
    const lesson = SEED_TERMS[0]!.weeks[0]!.lessons[0]!;
    expect(findLesson(SEED_TERMS, lesson.id)?.id).toBe(lesson.id);
  });
});

describe("canCompleteLesson", () => {
  const lessonWithTest: Lesson = {
    id: "lesson-x",
    day: "monday",
    title: "X",
    description: "",
    videoUrl: "",
    durationMinutes: 30,
    resources: [],
    lessonTest: {
      id: "lt-x",
      title: "Test",
      description: "",
      questions: [],
      passMark: 50,
      resources: [],
      memoResources: [],
    },
  };

  it("allows complete when there is no lesson test", () => {
    const lesson: Lesson = { ...lessonWithTest, lessonTest: undefined };
    expect(canCompleteLesson(lesson, {})).toEqual({ ok: true });
  });

  it("blocks complete when the lesson test has no score", () => {
    const result = canCompleteLesson(lessonWithTest, {});
    expect(result.ok).toBe(false);
  });

  it("blocks complete when score is below pass mark", () => {
    const result = canCompleteLesson(lessonWithTest, { "lt-x": 40 });
    expect(result.ok).toBe(false);
  });

  it("allows complete when score meets pass mark", () => {
    expect(canCompleteLesson(lessonWithTest, { "lt-x": 50 })).toEqual({ ok: true });
  });
});

describe("stripCurriculumSecrets", () => {
  it("removes answerIndex, memoResources, and markdown for students", () => {
    const stripped = stripCurriculumSecrets(SEED_TERMS);
    const q = stripped[0]!.weeks[0]!.weekTest.questions[0]!;
    expect(q.answerIndex).toBeUndefined();
    expect(stripped[0]!.weeks[0]!.weekTest.memoResources).toEqual([]);
    expect(stripped[0]!.pastPaper.memoResources).toEqual([]);

    const seedLesson = SEED_TERMS[0]!.weeks[0]!.lessons[0]!;
    const strippedLesson = stripped[0]!.weeks[0]!.lessons[0]!;
    expect(seedLesson.resources.some((r) => r.type === "markdown")).toBe(true);
    expect(strippedLesson.resources.some((r) => r.type === "markdown")).toBe(false);
    expect(strippedLesson.resources.every((r) => r.type !== "markdown")).toBe(true);

    // Original seed unchanged
    expect(SEED_TERMS[0]!.weeks[0]!.weekTest.questions[0]!.answerIndex).toBeDefined();
  });
});
