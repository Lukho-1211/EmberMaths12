import {
  effectiveLessonTest,
  realMcqQuestions,
} from "@/lib/domain/placeholder-mcq";
import type {
  AssessmentQuestion,
  Lesson,
  LessonTest,
  PastPaper,
  PreExam,
  Resource,
  Term,
  WeekTest,
} from "@/lib/types";

export type AssessmentKind = "lessonTest" | "weekTest" | "preExam" | "pastPaper";

export type FoundAssessment = {
  kind: AssessmentKind;
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  passMark: number;
  resources: Resource[];
  memoResources: Resource[];
  /** Past papers are practice-only and must not update pass/fail. */
  practiceOnly: boolean;
  /** Present when kind is lessonTest — the parent lesson. */
  lesson?: Lesson;
};

/** Walk the term tree and resolve an assessment by id. */
export function findAssessment(
  terms: Term[],
  assessmentId: string,
): FoundAssessment | null {
  for (const term of terms) {
    if (term.preExam.id === assessmentId) {
      return fromScored(term.preExam, "preExam", false);
    }
    if (term.pastPaper.id === assessmentId) {
      return fromPastPaper(term.pastPaper);
    }
    for (const week of term.weeks) {
      if (week.weekTest.id === assessmentId) {
        return fromScored(week.weekTest, "weekTest", false);
      }
      for (const lesson of week.lessons) {
        if (lesson.lessonTest?.id === assessmentId) {
          const effective = effectiveLessonTest(lesson);
          if (!effective) {
            // Leftover seed / no Markdown source — treat as missing for MCQ.
            return {
              ...fromScored(
                { ...lesson.lessonTest, questions: [] },
                "lessonTest",
                false,
              ),
              lesson,
            };
          }
          return {
            ...fromScored(effective, "lessonTest", false),
            lesson,
          };
        }
      }
    }
  }
  return null;
}

/** Find a lesson by id across the curriculum. */
export function findLesson(terms: Term[], lessonId: string): Lesson | null {
  for (const term of terms) {
    for (const week of term.weeks) {
      for (const lesson of week.lessons) {
        if (lesson.id === lessonId) return lesson;
      }
    }
  }
  return null;
}

/**
 * Whether a student may mark a lesson complete given their stored progress.
 * If the day has a real (admin-sourced) lessonTest, they must have a score >= passMark.
 * Leftover seed banks / no Markdown do not gate completion.
 */
export function canCompleteLesson(
  lesson: Lesson,
  testScores: Record<string, number>,
): { ok: true } | { ok: false; error: string } {
  const lessonTest = effectiveLessonTest(lesson);
  if (!lessonTest) return { ok: true };
  const score = testScores[lessonTest.id];
  if (score === undefined) {
    return {
      ok: false,
      error: "Pass today's lesson test before marking this lesson complete.",
    };
  }
  const passMark = lessonTest.passMark ?? 50;
  if (score < passMark) {
    return {
      ok: false,
      error: `Need at least ${passMark}% on the lesson test (latest: ${score}%).`,
    };
  }
  return { ok: true };
}

function fromScored(
  assessment: LessonTest | WeekTest | PreExam,
  kind: Exclude<AssessmentKind, "pastPaper">,
  practiceOnly: boolean,
): FoundAssessment {
  return {
    kind,
    id: assessment.id,
    title: assessment.title,
    description: assessment.description,
    questions: realMcqQuestions(assessment.questions ?? []),
    passMark: assessment.passMark ?? 50,
    resources: assessment.resources ?? [],
    memoResources: assessment.memoResources ?? [],
    practiceOnly,
  };
}

function fromPastPaper(pastPaper: PastPaper): FoundAssessment {
  return {
    kind: "pastPaper",
    id: pastPaper.id,
    title: pastPaper.title,
    description: pastPaper.description,
    questions: [],
    passMark: pastPaper.passMark ?? 50,
    resources: pastPaper.resources ?? [],
    memoResources: pastPaper.memoResources ?? [],
    practiceOnly: true,
  };
}
