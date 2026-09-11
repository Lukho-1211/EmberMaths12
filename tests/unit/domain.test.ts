import { describe, expect, it } from "vitest";
import {
  canCompleteLesson,
  findAssessment,
  findLesson,
  hasRealMcqQuestions,
  isPlaceholderMcqPrompt,
  realMcqQuestions,
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
  it("finds a week test and drops leftover seed MCQs", () => {
    const found = findAssessment(SEED_TERMS, "test-t1-w1");
    expect(found).not.toBeNull();
    expect(found!.kind).toBe("weekTest");
    expect(found!.practiceOnly).toBe(false);
    expect(found!.questions).toEqual([]);
  });

  it("finds a lesson test with parent lesson", () => {
    const lesson = SEED_TERMS[0]!.weeks[0]!.lessons[0]!;
    const testId = lesson.lessonTest!.id;
    const found = findAssessment(SEED_TERMS, testId);
    expect(found).not.toBeNull();
    expect(found!.kind).toBe("lessonTest");
    expect(found!.lesson?.id).toBe(lesson.id);
    // Seed lesson prompts are placeholders even when Markdown exists in the fixture.
    expect(found!.questions).toEqual([]);
  });

  it("finds a pre-exam and drops leftover seed MCQs", () => {
    const found = findAssessment(SEED_TERMS, "preexam-t1");
    expect(found?.kind).toBe("preExam");
    expect(found?.practiceOnly).toBe(false);
    expect(found?.questions).toEqual([]);
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

describe("placeholder MCQ filters", () => {
  it("detects seed week, lesson, and pre-exam prompts", () => {
    expect(
      isPlaceholderMcqPrompt("Which statement best relates to Series & Sigma Notation?"),
    ).toBe(true);
    expect(
      isPlaceholderMcqPrompt("What is the main focus of today’s lesson (Sigma notation)?"),
    ).toBe(true);
    expect(
      isPlaceholderMcqPrompt("Term 1 pre-exam: which area was covered across the four weeks?"),
    ).toBe(true);
  });

  it("keeps generated lesson-test prompts", () => {
    expect(
      isPlaceholderMcqPrompt(
        'According to today’s lesson materials on “Sigma notation”, which statement is correct?',
      ),
    ).toBe(false);
    expect(
      realMcqQuestions([
        {
          id: "real",
          prompt: "From the uploaded lesson notes, which idea best matches this lesson?",
        },
        {
          id: "seed",
          prompt: "What is the main focus of today’s lesson (Sigma notation)?",
        },
      ]),
    ).toEqual([
      {
        id: "real",
        prompt: "From the uploaded lesson notes, which idea best matches this lesson?",
      },
    ]);
  });

  it("treats seed-only banks as empty", () => {
    expect(hasRealMcqQuestions(SEED_TERMS[0]!.weeks[0]!.weekTest.questions)).toBe(false);
    expect(hasRealMcqQuestions(SEED_TERMS[0]!.preExam.questions)).toBe(false);
  });
});

describe("canCompleteLesson", () => {
  const realQuestion = {
    id: "q1",
    prompt: "According to today’s lesson materials on “X”, which statement is correct?",
    options: ["A", "B", "C", "D"],
    answerIndex: 1,
  };

  const lessonWithRealTest: Lesson = {
    id: "lesson-x",
    day: "monday",
    title: "X",
    description: "",
    videoUrl: "",
    durationMinutes: 30,
    resources: [
      {
        id: "md-1",
        title: "Notes",
        type: "markdown",
        url: "data:text/markdown;charset=utf-8,Hello",
      },
    ],
    lessonTest: {
      id: "lt-x",
      title: "Test",
      description: "",
      questions: [realQuestion],
      passMark: 50,
      resources: [],
      memoResources: [],
    },
  };

  const lessonWithSeedOnly: Lesson = {
    id: "lesson-seed",
    day: "tuesday",
    title: "Seed",
    description: "",
    videoUrl: "",
    durationMinutes: 30,
    resources: [
      {
        id: "pdf-1",
        title: "PDF",
        type: "pdf",
        url: "https://example.com/notes.pdf",
      },
    ],
    lessonTest: {
      id: "lt-seed",
      title: "Seed test",
      description: "",
      questions: [
        {
          id: "s1",
          prompt: "What is the main focus of today’s lesson (Seed)?",
          options: ["A", "B", "C", "D"],
          answerIndex: 1,
        },
      ],
      passMark: 50,
      resources: [],
      memoResources: [],
    },
  };

  it("allows complete when there is no lesson test", () => {
    const lesson: Lesson = { ...lessonWithRealTest, lessonTest: undefined };
    expect(canCompleteLesson(lesson, {})).toEqual({ ok: true });
  });

  it("allows complete when lesson test is leftover seed without Markdown", () => {
    expect(canCompleteLesson(lessonWithSeedOnly, {})).toEqual({ ok: true });
  });

  it("blocks complete when a real lesson test has no score", () => {
    const result = canCompleteLesson(lessonWithRealTest, {});
    expect(result.ok).toBe(false);
  });

  it("blocks complete when score is below pass mark", () => {
    const result = canCompleteLesson(lessonWithRealTest, { "lt-x": 40 });
    expect(result.ok).toBe(false);
  });

  it("allows complete when score meets pass mark", () => {
    expect(canCompleteLesson(lessonWithRealTest, { "lt-x": 50 })).toEqual({ ok: true });
  });
});

describe("stripCurriculumSecrets", () => {
  it("removes answerIndex, memoResources, markdown, and leftover seed MCQs", () => {
    const stripped = stripCurriculumSecrets(SEED_TERMS);
    expect(stripped[0]!.weeks[0]!.weekTest.questions).toEqual([]);
    expect(stripped[0]!.weeks[0]!.weekTest.memoResources).toEqual([]);
    expect(stripped[0]!.pastPaper.memoResources).toEqual([]);
    expect(stripped[0]!.preExam.questions).toEqual([]);

    const seedLesson = SEED_TERMS[0]!.weeks[0]!.lessons[0]!;
    const strippedLesson = stripped[0]!.weeks[0]!.lessons[0]!;
    expect(seedLesson.resources.some((r) => r.type === "markdown")).toBe(true);
    expect(strippedLesson.resources.some((r) => r.type === "markdown")).toBe(false);
    // Seed lesson prompts are placeholders → no student lessonTest even with Markdown.
    expect(strippedLesson.lessonTest).toBeUndefined();

    // Original seed unchanged
    expect(SEED_TERMS[0]!.weeks[0]!.weekTest.questions[0]!.answerIndex).toBeDefined();
  });

  it("omits lessonTest when Markdown is missing even if seed questions exist", () => {
    const lesson: Lesson = {
      id: "pdf-only",
      day: "monday",
      title: "PDF only",
      description: "",
      videoUrl: "",
      durationMinutes: 25,
      resources: [
        {
          id: "p1",
          title: "Notes",
          type: "pdf",
          url: "https://example.com/a.pdf",
        },
      ],
      lessonTest: {
        id: "lt-pdf",
        title: "Test",
        description: "",
        questions: [
          {
            id: "q1",
            prompt: "What is the main focus of today’s lesson (PDF only)?",
            options: ["A", "B", "C", "D"],
            answerIndex: 1,
          },
        ],
        passMark: 50,
        resources: [],
        memoResources: [],
      },
    };
    const terms = [
      {
        ...SEED_TERMS[0]!,
        weeks: [
          {
            ...SEED_TERMS[0]!.weeks[0]!,
            lessons: [lesson],
          },
        ],
      },
    ];
    const stripped = stripCurriculumSecrets(terms);
    expect(stripped[0]!.weeks[0]!.lessons[0]!.lessonTest).toBeUndefined();
  });

  it("keeps generated lesson MCQs when Markdown source is present", () => {
    const lesson: Lesson = {
      id: "md-lesson",
      day: "monday",
      title: "With MD",
      description: "",
      videoUrl: "",
      durationMinutes: 25,
      resources: [
        {
          id: "m1",
          title: "Notes",
          type: "markdown",
          url: "data:text/markdown;charset=utf-8,# Hello",
        },
      ],
      lessonTest: {
        id: "lt-md",
        title: "Test",
        description: "",
        questions: [
          {
            id: "q1",
            prompt: "Based on the lesson document, which option is accurate?",
            options: ["A", "B", "C", "D"],
            answerIndex: 2,
          },
        ],
        passMark: 50,
        resources: [],
        memoResources: [],
      },
    };
    const terms = [
      {
        ...SEED_TERMS[0]!,
        weeks: [
          {
            ...SEED_TERMS[0]!.weeks[0]!,
            lessons: [lesson],
          },
        ],
      },
    ];
    const stripped = stripCurriculumSecrets(terms);
    const out = stripped[0]!.weeks[0]!.lessons[0]!.lessonTest;
    expect(out).toBeDefined();
    expect(out!.questions).toHaveLength(1);
    expect(out!.questions[0]!.answerIndex).toBeUndefined();
    expect(out!.questions[0]!.prompt).toContain("Based on the lesson document");
  });
});
