import type { PastPaper, PreExam, Term } from "@/lib/types";

const TERM_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Term 1",
  2: "Term 2",
  3: "Term 3",
  4: "Term 4",
};

function makeEmptyPreExam(termNumber: 1 | 2 | 3 | 4): PreExam {
  return {
    id: `preexam-t${termNumber}`,
    title: `Term ${termNumber} pre-exam`,
    description:
      "End-of-term assessment. Choose on-screen MCQ or Paper + scan once admin uploads materials.",
    questions: [],
    passMark: 50,
    resources: [],
    memoResources: [],
  };
}

function makeEmptyPastPaper(termNumber: 1 | 2 | 3 | 4): PastPaper {
  return {
    id: `pastpaper-t${termNumber}`,
    title: `Term ${termNumber} past papers`,
    description:
      "Previous exam papers for practice. Download, write on paper, then scan for feedback.",
    passMark: 50,
    resources: [],
    memoResources: [],
  };
}

/** Term 1–4 shells with no weeks, questions, or files — admin fills via /admin/terms. */
export function createEmptyTerms(): Term[] {
  return ([1, 2, 3, 4] as const).map((number) => ({
    id: `term-${number}`,
    number,
    title: TERM_TITLES[number],
    weeks: [],
    preExam: makeEmptyPreExam(number),
    pastPaper: makeEmptyPastPaper(number),
  }));
}
