import { describe, expect, it } from "vitest";
import { createEmptyTerms } from "@/lib/curriculum/empty-terms";
import { normalizeAppState } from "@/lib/curriculum/normalize-app-state";
import type { AppState, Lesson, Term } from "@/lib/types";

describe("createEmptyTerms", () => {
  it("returns four term shells with no weeks, questions, or video URLs", () => {
    const terms = createEmptyTerms();
    expect(terms).toHaveLength(4);
    expect(terms.map((t) => t.number)).toEqual([1, 2, 3, 4]);
    for (const term of terms) {
      expect(term.weeks).toEqual([]);
      expect(term.preExam.questions).toEqual([]);
      expect(term.preExam.resources).toEqual([]);
      expect(term.pastPaper.resources).toEqual([]);
      expect(term.pastPaper.memoResources).toEqual([]);
    }
  });
});

describe("normalizeAppState", () => {
  it("does not inject a lessonTest when the lesson has none", () => {
    const lessonWithoutTest: Lesson = {
      id: "t1-w1-monday",
      day: "monday",
      title: "Monday: Untitled",
      description: "",
      videoUrl: "",
      durationMinutes: 25,
      resources: [],
    };
    const term: Term = {
      id: "term-1",
      number: 1,
      title: "Term 1",
      weeks: [
        {
          id: "week-1",
          number: 1,
          topic: "Admin topic",
          lessons: [lessonWithoutTest],
          weekTest: {
            id: "test-1",
            title: "Week 1 Saturday Test",
            description: "",
            questions: [],
            passMark: 50,
            resources: [],
            memoResources: [],
          },
        },
      ],
      preExam: {
        id: "preexam-t1",
        title: "Term 1 pre-exam",
        description: "",
        questions: [],
        passMark: 50,
        resources: [],
        memoResources: [],
      },
      pastPaper: {
        id: "pastpaper-t1",
        title: "Term 1 past papers",
        description: "",
        passMark: 50,
        resources: [],
        memoResources: [],
      },
    };
    const raw: AppState = {
      users: [],
      terms: [term],
      progress: [],
      badges: [],
      groups: [],
      classes: [],
      messages: [],
      corrections: [],
      teacherLessons: [],
    };
    const normalized = normalizeAppState(raw);
    const lesson = normalized.terms[0]!.weeks[0]!.lessons[0]!;
    expect(lesson.lessonTest).toBeUndefined();
  });
});
