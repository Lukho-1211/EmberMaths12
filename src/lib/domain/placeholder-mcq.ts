import type { AssessmentQuestion, Lesson, LessonTest, Resource } from "@/lib/types";

function isUploadedResourceUrl(url: string): boolean {
  return (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

/** True when a resource should drive daily lesson-test MCQ (uploaded Markdown). */
function isLessonMarkdownSource(resource: Resource): boolean {
  return resource.type === "markdown" && isUploadedResourceUrl(resource.url);
}

/**
 * Leftover seed MCQ prompts from `src/lib/mock/curriculum.ts`.
 * These are not from an admin-uploaded source file.
 */
export function isPlaceholderMcqPrompt(prompt: string): boolean {
  const p = prompt.trim().toLowerCase();

  // Saturday week-test seeds (`makeWeekTest`)
  if (p.startsWith("which statement best relates to ")) return true;
  if (p.includes("a learner should prepare for saturday week tests")) return true;
  if (/^in the context of .+,\s*the next step after practice is/.test(p)) return true;

  // Daily lesson-test seeds (`makeLessonTest`)
  if (p.startsWith("what is the main focus of today’s lesson")) return true;
  if (p.startsWith("what is the main focus of today's lesson")) return true;
  if (p.startsWith("this lesson sits inside the week topic")) return true;
  if (p.includes("before marking a lesson complete in ember maths12")) return true;
  if (p.startsWith("a sensible next step after studying")) return true;

  // Pre-exam seeds (`makePreExam`)
  if (p.includes("pre-exam: which area was covered")) return true;
  if (p.startsWith("pre-exams are written")) return true;
  if (p.startsWith("a pass mark in ember maths12 assessments is")) return true;
  if (p.startsWith("best study habit before a pre-exam")) return true;

  return false;
}

/** Alias kept for paper-scan / week-test call sites. */
export function isPlaceholderWeekTestPrompt(prompt: string): boolean {
  return isPlaceholderMcqPrompt(prompt);
}

/** Keep only questions that are not leftover seed placeholders. */
export function realMcqQuestions<T extends { prompt: string }>(
  questions: T[] | undefined,
): T[] {
  if (!questions?.length) return [];
  return questions.filter((q) => !isPlaceholderMcqPrompt(q.prompt));
}

/**
 * Whether a lesson should expose an on-screen lesson test to students.
 * Requires uploaded Markdown (MCQ source) and at least one non-placeholder question.
 */
export function lessonHasStudentMcq(
  lesson: Pick<Lesson, "resources" | "lessonTest">,
): boolean {
  const test = lesson.lessonTest;
  if (!test) return false;
  const hasMarkdown = (lesson.resources ?? []).some(isLessonMarkdownSource);
  if (!hasMarkdown) return false;
  return realMcqQuestions(test.questions).length > 0;
}

/** Assessment banks that only contain seed placeholders count as empty for MCQ UI. */
export function hasRealMcqQuestions(
  questions: AssessmentQuestion[] | undefined,
): boolean {
  return realMcqQuestions(questions).length > 0;
}

/** Effective lesson test for student gating (undefined when no real MCQ source). */
export function effectiveLessonTest(
  lesson: Pick<Lesson, "resources" | "lessonTest">,
): LessonTest | undefined {
  if (!lessonHasStudentMcq(lesson)) return undefined;
  const test = lesson.lessonTest!;
  return {
    ...test,
    questions: realMcqQuestions(test.questions),
  };
}

export function hasLessonMarkdownSource(resources: Resource[] | undefined): boolean {
  return (resources ?? []).some(isLessonMarkdownSource);
}
