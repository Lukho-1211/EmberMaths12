"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { MarkdownPreview } from "@/components/markdown-preview";
import { hasVideoSources } from "@/lib/lesson-video";
import { mockPaperGrade } from "@/lib/mock-paper-grade";
import { useStore } from "@/lib/store";
import type { CorrectionResult, LessonTest, PreExam, Resource, WeekTest } from "@/lib/types";

type AssessmentLike = WeekTest | PreExam | LessonTest;

type AssessmentMode = "mcq" | "paper";
type PaperStep = "questions" | "upload" | "result";

function AssessmentMaterials({
  resources,
  assessmentTitle,
}: {
  resources: Resource[];
  assessmentTitle: string;
}) {
  const [openMarkdownId, setOpenMarkdownId] = useState<string | null>(null);
  if (resources.length === 0) return null;

  const showVideo = hasVideoSources(resources);

  return (
    <div className="mb-6 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <h3 className="text-sm font-semibold">Exam paper / materials</h3>
      <p className="mt-1 text-xs text-muted">
        {showVideo
          ? "Watch the paper walkthrough before you answer, or download the PDF / Markdown."
          : "Download the PDF or view the Markdown paper before answering."}
      </p>
      {showVideo ? (
        <div className="mt-3">
          <LessonVideoPlayer title={assessmentTitle} resources={resources} />
        </div>
      ) : null}
      <ul className="mt-3 space-y-2">
        {resources.map((r) => {
          const isUploaded = r.url.startsWith("data:");
          const isMarkdown = r.type === "markdown";

          if (isMarkdown && isUploaded) {
            const open = openMarkdownId === r.id;
            return (
              <li key={r.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setOpenMarkdownId((id) => (id === r.id ? null : r.id))}
                  className="flex w-full items-start gap-2 text-left text-sm hover:text-ember-gold"
                >
                  <FileText size={16} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="block font-medium">{r.title}</span>
                    <span className="text-xs uppercase text-muted">
                      markdown · {open ? "hide" : "view"}
                    </span>
                  </span>
                </button>
                {open ? (
                  <MarkdownPreview
                    resource={r}
                    className="rounded-lg border border-border bg-white p-3"
                  />
                ) : null}
              </li>
            );
          }

          return (
            <li key={r.id}>
              <a
                href={r.url === "#" ? undefined : r.url}
                className="flex items-start gap-2 text-sm hover:text-ember-gold"
                download={
                  r.type === "pdf" || r.type === "markdown" ? r.fileName ?? true : undefined
                }
                target={r.type === "pdf" && isUploaded ? "_blank" : undefined}
                rel="noreferrer"
                onClick={(e) => {
                  if (!r.url || r.url === "#") {
                    e.preventDefault();
                    alert("Placeholder resource — upload a PDF or Markdown in Admin → Terms.");
                  }
                }}
              >
                <Download size={16} className="mt-0.5 shrink-0" />
                <span>
                  <span className="block font-medium">{r.title}</span>
                  <span className="text-xs uppercase text-muted">
                    {r.type}
                    {r.fileName ? ` · ${r.fileName}` : ""}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function AssessmentQuiz({
  assessment,
  studentId,
  onDone,
}: {
  assessment: AssessmentLike;
  studentId: string;
  onDone?: (score: number) => void;
}) {
  const { submitTestScore } = useStore();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);

  const total = assessment.questions.length;
  const resources = assessment.resources ?? [];

  function submit() {
    let correct = 0;
    for (const q of assessment.questions) {
      if (answers[q.id] === q.answerIndex) correct += 1;
    }
    const pct = Math.round((correct / total) * 100);
    setScore(pct);
    submitTestScore(studentId, assessment.id, pct);
    onDone?.(pct);
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-display text-2xl">{assessment.title}</h2>
      <p className="mt-1 text-sm text-muted">{assessment.description}</p>
      <div className="mt-6">
        <AssessmentMaterials resources={resources} assessmentTitle={assessment.title} />
      </div>
      <div className="space-y-6">
        {assessment.questions.map((q, idx) => (
          <fieldset key={q.id}>
            <legend className="mb-2 text-sm font-semibold">
              {idx + 1}. {q.prompt}
            </legend>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <label
                  key={opt}
                  className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-ember-gold"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === oi}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                    disabled={score !== null}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {score === null ? (
        <button
          type="button"
          onClick={submit}
          disabled={Object.keys(answers).length < total}
          className="mt-6 rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy disabled:opacity-50"
        >
          Submit assessment
        </button>
      ) : (
        <p className="mt-6 rounded-md bg-ember-navy px-4 py-3 text-sm font-semibold text-white">
          Score: {score}% — {score >= assessment.passMark ? "Pass" : "Needs improvement"} (pass mark{" "}
          {assessment.passMark}%)
        </p>
      )}
    </div>
  );
}

export function AssessmentPaperScan({
  assessment,
  studentId,
  onDone,
}: {
  assessment: AssessmentLike;
  studentId: string;
  onDone?: (score: number) => void;
}) {
  const { addCorrection, submitTestScore } = useStore();
  const [step, setStep] = useState<PaperStep>("questions");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);

  const resources = assessment.resources ?? [];

  async function runCorrection() {
    if (!fileName) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    const graded = mockPaperGrade({
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      questions: assessment.questions,
      fileName,
      passMark: assessment.passMark,
      memoResources: assessment.memoResources,
    });
    const saved = addCorrection({
      studentId,
      fileName,
      score: graded.score,
      feedback: graded.feedback,
      summary: graded.summary,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      mode: "paper-scan",
      questionFeedback: graded.questionFeedback,
    });
    submitTestScore(studentId, assessment.id, graded.score);
    setResult(saved);
    setStep("result");
    setBusy(false);
    onDone?.(graded.score);
  }

  function shareResult(c: CorrectionResult) {
    const text = `EmberMaths12 paper scan — ${c.assessmentTitle ?? c.fileName}: ${c.score}%\n${c.summary}`;
    void navigator.clipboard?.writeText(text);
    alert("Result copied to clipboard (mock share).");
  }

  function onFileChange(file: File | undefined) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setFileName("");
      setPreviewUrl(null);
      return;
    }
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-display text-2xl">{assessment.title}</h2>
      <p className="mt-1 text-sm text-muted">{assessment.description}</p>
      <p className="mt-2 text-xs text-muted">
        Paper path (demo): write answers on paper, then upload a scan for mock AI correction.
      </p>

      <div className="mt-6">
        <AssessmentMaterials resources={resources} assessmentTitle={assessment.title} />
      </div>

      <ol className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {(
          [
            ["questions", "1. Questions"],
            ["upload", "2. Scan"],
            ["result", "3. Feedback"],
          ] as const
        ).map(([key, label]) => (
          <li
            key={key}
            className={
              step === key
                ? "rounded-md bg-ember-navy px-2 py-1 text-white"
                : "rounded-md bg-surface px-2 py-1"
            }
          >
            {label}
          </li>
        ))}
      </ol>

      {step === "questions" ? (
        <div>
          <p className="mb-4 text-sm text-muted">
            Copy these questions onto paper (or print this screen). Show full working. Options are
            shown as a reference only — write your own answers.
          </p>
          <div className="space-y-5 print:space-y-4">
            {assessment.questions.map((q, idx) => (
              <div key={q.id} className="rounded-md border border-border px-3 py-3">
                <p className="text-sm font-semibold">
                  {idx + 1}. {q.prompt}
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                  {q.options.map((opt) => (
                    <li key={opt}>{opt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setStep("upload")}
            className="mt-6 rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
          >
            I&apos;m ready to scan
          </button>
        </div>
      ) : null}

      {step === "upload" ? (
        <div>
          <p className="mb-4 text-sm text-muted">
            Photograph or upload your handwritten page. This demo does not run real OCR — feedback
            is a mock mark against this assessment&apos;s question bank.
          </p>
          <label className="block text-sm font-medium">
            Upload page image
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="mt-2 block w-full text-sm"
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
          </label>
          {previewUrl ? (
            /* Blob preview — next/image is not suited to object URLs */
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={previewUrl}
              alt="Scan preview"
              className="mt-4 max-h-64 rounded-md border border-border object-contain"
            />
          ) : null}
          {fileName ? <p className="mt-2 text-xs text-muted">Selected: {fileName}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("questions")}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
            >
              Back to questions
            </button>
            <button
              type="button"
              disabled={!fileName || busy}
              onClick={() => void runCorrection()}
              className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Analysing…" : "Run AI correction"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "result" && result ? (
        <div>
          <p className="rounded-md bg-ember-navy px-4 py-3 text-sm font-semibold text-white">
            Score: {result.score}% —{" "}
            {result.score >= assessment.passMark ? "Pass" : "Needs improvement"} (pass mark{" "}
            {assessment.passMark}%)
          </p>
          <p className="mt-3 text-sm">{result.summary}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            {result.feedback.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {result.questionFeedback?.length ? (
            <div className="mt-5 space-y-3">
              <h3 className="text-sm font-semibold">Per-question feedback</h3>
              {result.questionFeedback.map((qf, idx) => (
                <div
                  key={qf.questionId}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    qf.correct
                      ? "border-success/40 bg-success/5"
                      : "border-ember-gold/50 bg-ember-gold/10"
                  }`}
                >
                  <p className="font-medium">
                    {idx + 1}. {qf.prompt}{" "}
                    <span className="text-xs uppercase text-muted">
                      · {qf.correct ? "Correct" : "Needs work"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted">{qf.note}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => shareResult(result)}
              className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
            >
              Share results
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("upload");
                setResult(null);
                onFileChange(undefined);
              }}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
            >
              Scan again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AssessmentPanel({
  assessment,
  studentId,
  initialMode = "mcq",
  onDone,
}: {
  assessment: AssessmentLike;
  studentId: string;
  initialMode?: AssessmentMode;
  onDone?: (score: number) => void;
}) {
  const [mode, setMode] = useState<AssessmentMode>(initialMode);

  return (
    <div>
      <div
        className="mb-4 inline-flex rounded-lg border border-border bg-surface p-1"
        role="tablist"
        aria-label="Assessment mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "mcq"}
          onClick={() => setMode("mcq")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            mode === "mcq" ? "bg-ember-navy text-white" : "text-muted hover:text-ember-navy"
          }`}
        >
          On screen (MCQ)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "paper"}
          onClick={() => setMode("paper")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
            mode === "paper" ? "bg-ember-navy text-white" : "text-muted hover:text-ember-navy"
          }`}
        >
          Paper + scan
        </button>
      </div>
      {mode === "mcq" ? (
        <AssessmentQuiz assessment={assessment} studentId={studentId} onDone={onDone} />
      ) : (
        <AssessmentPaperScan assessment={assessment} studentId={studentId} onDone={onDone} />
      )}
    </div>
  );
}

export function ProgressRing({ value }: { value: number }) {
  const pct = useMemo(() => Math.max(0, Math.min(100, value)), [value]);
  return (
    <div className="relative grid h-28 w-28 place-items-center">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#E5E5E5"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#FCA311"
          strokeWidth="3"
          strokeDasharray={`${pct}, 100`}
        />
      </svg>
      <span className="absolute font-display text-2xl">{pct}%</span>
    </div>
  );
}
