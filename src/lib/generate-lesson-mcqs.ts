import { decodeMarkdownResource } from "@/lib/lesson-file";
import { extractPdfText } from "@/lib/lesson-video/pdf-utils";
import type {
  AssessmentQuestion,
  Lesson,
  LessonTest,
  Resource,
} from "@/lib/types";

const GENERIC_DISTRACTORS = [
  "This is unrelated to Grade 12 CAPS Mathematics",
  "Skip this topic until Term 4 revision only",
  "Memorise formulas without working examples",
  "Ignore feedback and move on immediately",
  "Only study on Saturdays before week tests",
  "Replace daily practice with last-minute cramming",
];

const TARGET_QUESTION_COUNT = 5;

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*?|__?/g, "")
    .replace(/`+/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSnippets(text: string): string[] {
  const cleaned = stripMarkdown(text);
  if (!cleaned) return [];

  const raw = cleaned
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24 && s.length <= 180);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const s of raw) {
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s);
  }
  return unique;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDistractors(
  snippets: string[],
  correct: string,
  rand: () => number,
  count = 3,
): string[] {
  const pool = [
    ...snippets.filter((s) => s !== correct),
    ...GENERIC_DISTRACTORS,
  ];
  const picked: string[] = [];
  const used = new Set<string>([correct.toLowerCase()]);

  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    const [candidate] = pool.splice(idx, 1);
    const key = candidate.toLowerCase();
    if (used.has(key)) continue;
    used.add(key);
    picked.push(candidate.length > 120 ? `${candidate.slice(0, 117)}…` : candidate);
  }

  while (picked.length < count) {
    picked.push(GENERIC_DISTRACTORS[picked.length % GENERIC_DISTRACTORS.length]);
  }
  return picked;
}

function shuffleWithCorrect(
  correct: string,
  distractors: string[],
  rand: () => number,
): { options: string[]; answerIndex: number } {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, answerIndex: options.indexOf(correct) };
}

function truncateOption(text: string): string {
  return text.length > 140 ? `${text.slice(0, 137)}…` : text;
}

/** True when a resource can yield extractable lesson text. */
export function isExtractableLessonResource(resource: Resource): boolean {
  if (!resource.url.startsWith("data:")) return false;
  return resource.type === "markdown" || resource.type === "pdf";
}

export async function extractTextFromResources(resources: Resource[]): Promise<string> {
  const parts: string[] = [];
  for (const resource of resources) {
    if (!isExtractableLessonResource(resource)) continue;
    if (resource.type === "markdown") {
      const md = decodeMarkdownResource(resource.url);
      if (md?.trim()) parts.push(md);
      continue;
    }
    try {
      const pdfText = await extractPdfText(resource);
      if (pdfText) parts.push(pdfText);
    } catch {
      // Skip unreadable PDFs in the demo pipeline.
    }
  }
  return parts.join("\n\n").trim();
}

function buildQuestionsFromSnippets(
  lessonId: string,
  lessonTitle: string,
  snippets: string[],
  seedExtra = "",
): AssessmentQuestion[] {
  const rand = mulberry32(hashSeed(`${lessonId}|${seedExtra}|${snippets.join("|")}`));
  const count = Math.min(TARGET_QUESTION_COUNT, Math.max(3, snippets.length));
  const questions: AssessmentQuestion[] = [];

  for (let i = 0; i < count; i += 1) {
    const correctRaw = snippets[i % snippets.length];
    const correct = truncateOption(correctRaw);
    const distractors = pickDistractors(snippets, correctRaw, rand);
    const { options, answerIndex } = shuffleWithCorrect(correct, distractors, rand);

    const prompts = [
      `According to today’s lesson materials on “${lessonTitle}”, which statement is correct?`,
      `From the uploaded lesson notes, which idea best matches this lesson?`,
      `Which statement reflects what learners should take from this lesson?`,
      `Based on the lesson document, which option is accurate?`,
      `Which of the following aligns with the content of this lesson?`,
    ];

    questions.push({
      id: `lt-${lessonId}-q${i + 1}`,
      prompt: prompts[i % prompts.length],
      options,
      answerIndex,
    });
  }

  return questions;
}

export type GenerateLessonTestArgs = {
  lesson: Pick<Lesson, "id" | "title" | "day">;
  resources: Resource[];
  /** Optional existing memo attachments to preserve. */
  memoResources?: Resource[];
  /** Bump to force a different shuffle while keeping stable base ids. */
  regenerateToken?: string;
};

/**
 * Mock-generate a daily lesson test from uploaded PDF/Markdown text.
 * Returns null when there is no extractable content.
 */
export async function generateLessonTestFromResources(
  args: GenerateLessonTestArgs,
): Promise<LessonTest | null> {
  const { lesson, resources, memoResources = [], regenerateToken = "" } = args;
  const text = await extractTextFromResources(resources);
  const snippets = splitSnippets(text);
  if (snippets.length === 0) return null;

  const questions = buildQuestionsFromSnippets(
    lesson.id,
    lesson.title,
    snippets,
    regenerateToken,
  );

  return {
    id: `lesson-test-${lesson.id}`,
    title: `Lesson test — ${lesson.title}`,
    description:
      "Check today’s lesson. Choose on-screen MCQ or Paper + scan. Pass to mark the lesson complete.",
    questions,
    passMark: 50,
    resources: [],
    memoResources,
  };
}
