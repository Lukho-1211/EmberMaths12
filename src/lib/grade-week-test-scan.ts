import { createPartFromBase64, createPartFromText, GoogleGenAI, Type } from "@google/genai";
import { realMcqQuestions } from "@/lib/domain/placeholder-mcq";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuestionFeedback, Resource } from "@/lib/types";

export {
  isPlaceholderWeekTestPrompt,
  realMcqQuestions,
} from "@/lib/domain/placeholder-mcq";

export type WeekTestGradeResult = {
  score: number;
  feedback: string[];
  summary: string;
  questionFeedback: QuestionFeedback[];
};

export type GradeWeekTestScanArgs = {
  assessmentId: string;
  assessmentTitle: string;
  passMark: number;
  memoResources: Resource[];
  scanPath: string;
  fileName: string;
  /**
   * Optional on-screen MCQ prompts. Placeholder seed questions are stripped
   * so paper+scan feedback is inferred from the memo, not the dummy bank.
   */
  questions?: Array<{ id: string; prompt: string }>;
};

const GRADE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Overall percentage score from 0 to 100.",
    },
    summary: {
      type: Type.STRING,
      description: "Short overall summary for the learner (no full memo text).",
    },
    feedback: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "2–5 high-level feedback bullets.",
    },
    questionFeedback: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          prompt: { type: Type.STRING },
          correct: { type: Type.BOOLEAN },
          note: {
            type: Type.STRING,
            description:
              "Brief coaching note. Do not paste full memo solutions or mark allocations.",
          },
        },
        required: ["questionId", "prompt", "correct", "note"],
      },
    },
  },
  required: ["score", "summary", "feedback", "questionFeedback"],
} as const;

export function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Drop leftover seed MCQs so Gemini labels feedback from the memo. */
export function questionHintsForPaperScan(
  questions: Array<{ id: string; prompt: string }> | undefined,
): Array<{ id: string; prompt: string }> {
  return realMcqQuestions(questions);
}

export function parseCorrectFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "true" || s === "yes" || s === "1") return true;
    if (s === "false" || s === "no" || s === "0" || s === "") return false;
  }
  return false;
}

function rawQuestionFeedback(obj: Record<string, unknown>): unknown[] {
  if (Array.isArray(obj.questionFeedback)) return obj.questionFeedback;
  if (Array.isArray(obj.question_feedback)) return obj.question_feedback;
  return [];
}

export function parseGradeResponse(
  raw: unknown,
  passMark: number,
): WeekTestGradeResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Grader returned an empty response.");
  }
  const obj = raw as Record<string, unknown>;
  const score = clampScore(obj.score);
  const summary =
    typeof obj.summary === "string" && obj.summary.trim()
      ? obj.summary.trim()
      : score >= passMark
        ? "Pass band reached. Review notes and keep showing clear working."
        : "Below pass band. Revise the flagged items and resubmit.";

  const feedback = Array.isArray(obj.feedback)
    ? obj.feedback
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .map((f) => f.trim())
    : [];

  const questionFeedback: QuestionFeedback[] = rawQuestionFeedback(obj)
    .map((item, idx) => {
      if (!item || typeof item !== "object") return null;
      const q = item as Record<string, unknown>;
      const questionId =
        typeof q.questionId === "string" && q.questionId.trim()
          ? q.questionId.trim()
          : typeof q.question_id === "string" && q.question_id.trim()
            ? q.question_id.trim()
            : `q${idx + 1}`;
      const prompt =
        typeof q.prompt === "string" && q.prompt.trim()
          ? q.prompt.trim()
          : `Question ${idx + 1}`;
      const correct = parseCorrectFlag(q.correct);
      const note =
        typeof q.note === "string" && q.note.trim()
          ? q.note.trim()
          : correct
            ? "Marked correct against the memo."
            : "Needs work against the memo.";
      return { questionId, prompt, correct, note };
    })
    .filter((q): q is QuestionFeedback => q !== null);

  const ensuredFeedback =
    feedback.length > 0
      ? feedback
      : [
          `Marked against the admin memo.`,
          score >= passMark
            ? `Overall: pass band reached (pass mark ${passMark}%).`
            : `Overall: below pass band (pass mark ${passMark}%).`,
        ];

  return {
    score,
    summary,
    feedback: ensuredFeedback,
    questionFeedback,
  };
}

function mimeFromFileName(fileName: string, fallback: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "text/markdown";
  return fallback;
}

async function downloadScanBytes(
  scanPath: string,
): Promise<{ bytes: Buffer; mimeType: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("student-scans").download(scanPath);
  if (error || !data) {
    throw new Error(error?.message ?? "Could not download student scan.");
  }
  const bytes = Buffer.from(await data.arrayBuffer());
  const mimeType =
    data.type && data.type !== "application/octet-stream"
      ? data.type
      : mimeFromFileName(scanPath, "image/jpeg");
  return { bytes, mimeType };
}

async function loadMemoPart(memo: Resource): Promise<ReturnType<typeof createPartFromText>> {
  const url = memo.url;
  if (!url || url === "#") {
    throw new Error("Week test memo URL is missing. Ask admin to re-upload the memo.");
  }

  // Markdown data URLs (admin upload fallback)
  if (url.startsWith("data:")) {
    const comma = url.indexOf(",");
    const meta = url.slice(0, comma);
    const payload = url.slice(comma + 1);
    if (meta.includes(";base64")) {
      const text = Buffer.from(payload, "base64").toString("utf8");
      return createPartFromText(`MARKING MEMO (${memo.fileName ?? memo.title}):\n\n${text}`);
    }
    return createPartFromText(
      `MARKING MEMO (${memo.fileName ?? memo.title}):\n\n${decodeURIComponent(payload)}`,
    );
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Could not fetch week test memo (${res.status}).`);
  }
  const contentType = res.headers.get("content-type") ?? "";
  const fileName = memo.fileName ?? memo.title;
  const isMarkdown =
    memo.type === "markdown" ||
    contentType.includes("markdown") ||
    contentType.includes("text/plain") ||
    /\.md$/i.test(fileName) ||
    /\.markdown$/i.test(fileName);

  if (isMarkdown) {
    const text = await res.text();
    return createPartFromText(`MARKING MEMO (${fileName}):\n\n${text}`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  const mimeType = contentType.includes("pdf")
    ? "application/pdf"
    : mimeFromFileName(fileName, "application/pdf");
  return createPartFromBase64(bytes.toString("base64"), mimeType);
}

function buildPrompt(args: GradeWeekTestScanArgs): string {
  const hints = questionHintsForPaperScan(args.questions);
  const questionHints =
    hints.length > 0
      ? hints.map((q, i) => `${i + 1}. id=${q.id} — ${q.prompt}`).join("\n")
      : "(No on-screen question bank — infer question numbers and wording from the memo and the learner script.)";

  return [
    "You are marking a South African CAPS Grade 12 Mathematics Saturday week test.",
    `Assessment title: ${args.assessmentTitle}`,
    `Assessment id: ${args.assessmentId}`,
    `Pass mark: ${args.passMark}%`,
    `Learner scan filename: ${args.fileName}`,
    "",
    "You are given:",
    "1) The ADMIN MARKING MEMO (authoritative mark scheme).",
    "2) The LEARNER SCRIPT (photo or PDF of handwritten answers).",
    "",
    "Rules:",
    "- Mark ONLY against the memo. Do not invent alternative mark schemes.",
    "- Award marks as the memo allocates; convert to an overall percentage 0–100.",
    "- Unreadable or missing work scores 0 for that item; say so briefly in the note.",
    "- Do NOT paste full memo solutions, full mark allocations, or long worked answers into feedback.",
    "- Keep notes short and coaching-oriented for the learner.",
    "- Per-question feedback must describe the memo items (e.g. 1.1, 1.2), not generic MCQ prompts.",
    hints.length > 0
      ? "- Prefer questionIds from the list below when they match the memo; otherwise use q1, q2, …"
      : "- Number items as they appear on the memo (q1, q1_1, 1.1, …). Do not invent MCQ-style prompts.",
    "",
    "Known question prompts (optional):",
    questionHints,
  ].join("\n");
}

/**
 * Mark a Saturday week-test scan against the admin memo using Gemini.
 * Requires GEMINI_API_KEY (server-only).
 */
export async function gradeWeekTestScan(
  args: GradeWeekTestScanArgs,
): Promise<WeekTestGradeResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const memo = args.memoResources[0];
  if (!memo) {
    throw new Error("No week test memo uploaded. Ask admin to upload a memo under Admin → Terms.");
  }

  const [memoPart, scan] = await Promise.all([
    loadMemoPart(memo),
    downloadScanBytes(args.scanPath),
  ]);

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          createPartFromText(buildPrompt(args)),
          memoPart,
          createPartFromText("LEARNER SCRIPT follows:"),
          createPartFromBase64(scan.bytes.toString("base64"), scan.mimeType),
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: GRADE_SCHEMA,
      temperature: 0.2,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini returned no grading text.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Gemini returned invalid JSON.");
  }

  return parseGradeResponse(parsed, args.passMark);
}
