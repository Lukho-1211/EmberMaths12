import type { AppState } from "@/lib/types";

/** Coerce missing resource arrays; do not inject placeholder lessons or tests. */
export function normalizeAppState(raw: AppState): AppState {
  return {
    ...raw,
    terms: (raw.terms ?? []).map((term) => {
      const pastPaper = term.pastPaper
        ? {
            ...term.pastPaper,
            resources: term.pastPaper.resources ?? [],
            memoResources: term.pastPaper.memoResources ?? [],
          }
        : {
            id: `pastpaper-${term.id}`,
            title: `Term ${term.number} past papers`,
            description:
              "Previous exam papers for practice. Download, write on paper, then scan for feedback.",
            passMark: 50,
            resources: [],
            memoResources: [],
          };
      return {
        ...term,
        preExam: {
          ...term.preExam,
          resources: term.preExam.resources ?? [],
          memoResources: term.preExam.memoResources ?? [],
        },
        pastPaper,
        weeks: (term.weeks ?? []).map((week) => ({
          ...week,
          weekTest: {
            ...week.weekTest,
            resources: week.weekTest.resources ?? [],
            memoResources: week.weekTest.memoResources ?? [],
          },
          lessons: (week.lessons ?? []).map((lesson) => {
            if (!lesson.lessonTest) return lesson;
            return {
              ...lesson,
              lessonTest: {
                ...lesson.lessonTest,
                resources: lesson.lessonTest.resources ?? [],
                memoResources: lesson.lessonTest.memoResources ?? [],
              },
            };
          }),
        })),
      };
    }),
  };
}
