import { describe, expect, it } from "vitest";
import { buildTermInsight } from "@/lib/term-insights";
import type { StudentProgress, Term } from "@/lib/types";

function makeTerm(): Term {
  const emptyQuestions = {
    questions: [] as Term["weeks"][0]["weekTest"]["questions"],
    passMark: 50,
    resources: [],
    memoResources: [],
  };

  return {
    id: "term-t",
    number: 1,
    title: "Term 1",
    weeks: [
      {
        id: "week-1",
        number: 1,
        topic: "Algebra",
        lessons: [
          {
            id: "lesson-1",
            day: "monday",
            title: "Intro",
            description: "",
            videoUrl: "",
            durationMinutes: 30,
            resources: [],
            lessonTest: {
              id: "lt-1",
              title: "Lesson test",
              description: "",
              ...emptyQuestions,
            },
          },
          {
            id: "lesson-2",
            day: "tuesday",
            title: "Practice",
            description: "",
            videoUrl: "",
            durationMinutes: 30,
            resources: [],
          },
        ],
        weekTest: {
          id: "wt-1",
          title: "Saturday test",
          description: "",
          ...emptyQuestions,
        },
      },
      {
        id: "week-2",
        number: 2,
        topic: "Functions",
        lessons: [
          {
            id: "lesson-3",
            day: "monday",
            title: "Graphs",
            description: "",
            videoUrl: "",
            durationMinutes: 30,
            resources: [],
          },
        ],
        weekTest: {
          id: "wt-2",
          title: "Saturday test 2",
          description: "",
          ...emptyQuestions,
        },
      },
    ],
    preExam: {
      id: "pre-1",
      title: "Pre-exam",
      description: "",
      ...emptyQuestions,
    },
    pastPaper: {
      id: "past-1",
      title: "Past papers",
      description: "",
      passMark: 50,
      resources: [],
      memoResources: [],
    },
  };
}

describe("buildTermInsight", () => {
  it("returns pending when there is no progress data", () => {
    const insight = buildTermInsight(makeTerm(), undefined);
    expect(insight.status).toBe("pending");
    expect(insight.hasData).toBe(false);
    expect(insight.average).toBeUndefined();
  });

  it("bands week scores and derives term status", () => {
    const progress: StudentProgress = {
      studentId: "s1",
      completedLessonIds: ["lesson-1"],
      testScores: { "wt-1": 80, "wt-2": 40 },
      badgeIds: [],
      overallPercent: 60,
      status: "passing",
    };

    const insight = buildTermInsight(makeTerm(), progress);
    expect(insight.hasData).toBe(true);
    expect(insight.weeks[0]?.band).toBe("strong");
    expect(insight.weeks[1]?.band).toBe("weak");
    expect(insight.strengths.map((w) => w.topic)).toContain("Algebra");
    expect(insight.weaknesses.map((w) => w.topic)).toContain("Functions");
    expect(insight.average).toBe(60);
    expect(insight.status).toBe("on_track");
    expect(insight.improvements.some((a) => a.label.includes("Functions"))).toBe(true);
    expect(insight.improvements.some((a) => a.label.includes("Finish remaining"))).toBe(true);
  });

  it("marks strong terms when average is high", () => {
    const progress: StudentProgress = {
      studentId: "s1",
      completedLessonIds: ["lesson-1", "lesson-2", "lesson-3"],
      testScores: { "wt-1": 90, "wt-2": 85, "pre-1": 88 },
      badgeIds: [],
      overallPercent: 88,
      status: "passing",
    };

    const insight = buildTermInsight(makeTerm(), progress);
    expect(insight.status).toBe("strong");
    expect(insight.preExamScore).toBe(88);
  });
});
