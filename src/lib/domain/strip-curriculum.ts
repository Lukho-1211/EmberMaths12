import type {
  AssessmentQuestion,
  Badge,
  Lesson,
  LessonTest,
  PastPaper,
  PreExam,
  Term,
  Week,
  WeekTest,
} from "@/lib/types";

/** Drop answer keys and memos from questions for student/teacher/parent clients. */
export function stripQuestion(q: AssessmentQuestion): AssessmentQuestion {
  const { answerIndex: _answerIndex, ...rest } = q;
  return rest;
}

function stripLessonTest(test: LessonTest): LessonTest {
  return {
    ...test,
    questions: test.questions.map(stripQuestion),
    memoResources: [],
  };
}

function stripWeekTest(test: WeekTest): WeekTest {
  return {
    ...test,
    questions: test.questions.map(stripQuestion),
    memoResources: [],
  };
}

function stripPreExam(exam: PreExam): PreExam {
  return {
    ...exam,
    questions: exam.questions.map(stripQuestion),
    memoResources: [],
  };
}

function stripPastPaper(paper: PastPaper): PastPaper {
  return {
    ...paper,
    memoResources: [],
  };
}

function stripLesson(lesson: Lesson): Lesson {
  return {
    ...lesson,
    lessonTest: lesson.lessonTest ? stripLessonTest(lesson.lessonTest) : undefined,
  };
}

function stripWeek(week: Week): Week {
  return {
    ...week,
    lessons: week.lessons.map(stripLesson),
    weekTest: stripWeekTest(week.weekTest),
  };
}

function stripTerm(term: Term): Term {
  return {
    ...term,
    weeks: term.weeks.map(stripWeek),
    preExam: stripPreExam(term.preExam),
    pastPaper: stripPastPaper(term.pastPaper),
  };
}

/** Omit answerIndex and memoResources for non-admin curriculum payloads. */
export function stripCurriculumSecrets(terms: Term[]): Term[] {
  return terms.map(stripTerm);
}

export function stripCurriculumPayload(
  terms: Term[],
  badges: Badge[],
  isAdmin: boolean,
): { terms: Term[]; badges: Badge[] } {
  return {
    terms: isAdmin ? terms : stripCurriculumSecrets(terms),
    badges,
  };
}
