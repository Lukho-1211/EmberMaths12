import type { QuestionFeedback, Resource } from "@/lib/types";

type AssessmentQuestion = {
  id: string;
  prompt: string;
  options: string[];
  answerIndex: number;
};

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

const CORRECT_NOTES = [
  "Working is clear and the final answer matches the expected CAPS method.",
  "Good structure — reasons are labelled and steps align.",
  "Correct approach; keep showing intermediate simplification.",
];

const INCORRECT_NOTES = [
  "Check the final simplification — a sign or factor slip appears near the end.",
  "Method started well; revisit the key identity or formula for this prompt.",
  "Show each reason in the proof/working; the jump to the answer needs support.",
  "Revisit this week’s notes — the selected approach does not match the mark scheme.",
];

const GENERIC_PROMPTS = [
  "Question 1 — Algebra / equations",
  "Question 2 — Functions or graphs",
  "Question 3 — Sequences & series / finance",
  "Question 4 — Calculus or geometry",
  "Question 5 — Trigonometry / statistics",
  "Question 6 — Mixed exam-style problem",
];

function memoLabel(memoResources: Resource[] | undefined): string | null {
  const first = memoResources?.[0];
  if (!first) return null;
  return first.fileName || first.title;
}

export function mockPaperGrade(args: {
  assessmentId: string;
  assessmentTitle: string;
  questions: AssessmentQuestion[];
  fileName: string;
  passMark: number;
  memoResources?: Resource[];
}) {
  const { assessmentId, assessmentTitle, questions, fileName, passMark, memoResources } = args;
  const rand = mulberry32(hashSeed(`${assessmentId}::${fileName}`));
  const memo = memoLabel(memoResources);

  const bank =
    questions.length > 0
      ? questions
      : GENERIC_PROMPTS.map((prompt, idx) => ({
          id: `generic-q${idx + 1}`,
          prompt,
          options: ["—"],
          answerIndex: 0,
        }));

  const questionFeedback: QuestionFeedback[] = bank.map((q, idx) => {
    // Bias toward a passable demo: ~65–80% chance correct depending on seed + index.
    const threshold = 0.28 + (idx % 3) * 0.04;
    const correct = rand() > threshold;
    const notePool = correct ? CORRECT_NOTES : INCORRECT_NOTES;
    const note = notePool[Math.floor(rand() * notePool.length)]!;
    const expected = q.options[q.answerIndex];
    const hasMcqHint = questions.length > 0 && expected && expected !== "—";
    return {
      questionId: q.id,
      prompt: q.prompt,
      correct,
      note: correct
        ? note
        : memo
          ? `${note} (Checked against memo “${memo}”.)`
          : hasMcqHint
            ? `${note} (Expected direction: ${expected}.)`
            : note,
    };
  });

  const correctCount = questionFeedback.filter((q) => q.correct).length;
  const total = Math.max(questionFeedback.length, 1);
  const score = Math.round((correctCount / total) * 100);

  const feedback = [
    memo
      ? `Mock OCR read ${fileName} against “${assessmentTitle}” using memo “${memo}”.`
      : `Mock OCR read ${fileName} against “${assessmentTitle}”.`,
    `${correctCount} of ${total} questions marked correct.`,
    score >= passMark
      ? "Overall: pass band reached for this practice paper."
      : "Overall: below pass band — revise weak items below before retrying.",
  ];

  const summary =
    score >= passMark
      ? "Strong paper attempt. Review the marked items and keep the clear working style."
      : "Needs consolidation. Revisit the flagged questions and this term’s lessons, then rescan.";

  return { score, feedback, summary, questionFeedback };
}
