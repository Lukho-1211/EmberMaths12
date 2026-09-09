"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { meetsPassMark } from "@/lib/score-mcq";
import { useStore } from "@/lib/store";
import { uploadStudentScan } from "@/lib/supabase/student-scans";
import type {
  AssessmentQuestion,
  CorrectionResult,
  LessonTest,
  PastPaper,
  PreExam,
  Resource,
  StudentProgress,
  WeekTest,
} from "@/lib/types";

type AssessmentLike = WeekTest | PreExam | LessonTest;

/** Shape accepted by paper-scan (curriculum tests or past-paper packs). */
export type PaperScanAssessment = {
  id: string;
  title: string;
  description: string;
  passMark: number;
  resources: Resource[];
  memoResources: Resource[];
  questions?: AssessmentQuestion[];
};

type AssessmentMode = "mcq" | "paper";
type PaperStep = "questions" | "upload" | "review" | "result";
type CorrectionMode = "paper-scan" | "past-paper";

export function AssessmentMaterials({ resources }: { resources: Resource[] }) {
  const studentResources = resources.filter((r) => r.type !== "markdown");
  if (studentResources.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <h3 className="text-sm font-semibold">Exam paper / materials</h3>
      <p className="mt-1 text-xs text-muted">
        Download the PDF or other materials before answering.
      </p>
      <ul className="mt-3 space-y-2">
        {studentResources.map((r) => {
          const isUploaded =
            r.url.startsWith("data:") ||
            r.url.startsWith("http://") ||
            r.url.startsWith("https://");

          return (
            <li key={r.id}>
              <a
                href={r.url === "#" ? undefined : r.url}
                className="flex items-start gap-2 text-sm hover:text-ember-gold"
                download={r.type === "pdf" ? r.fileName ?? true : undefined}
                target={r.type === "pdf" && isUploaded ? "_blank" : undefined}
                rel="noreferrer"
                onClick={(e) => {
                  if (!r.url || r.url === "#") {
                    e.preventDefault();
                    alert("Placeholder resource — upload a PDF in Admin → Terms.");
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
  const { applyProgress } = useStore();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = assessment.questions.length;
  const resources = assessment.resources ?? [];

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/assessments/mcq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          assessmentId: assessment.id,
          answers,
          // studentId ignored server-side; session is authoritative
          studentId,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        score?: number;
        passed?: boolean;
        progress?: StudentProgress;
      };
      if (!res.ok || !body.ok || body.score === undefined) {
        setError(body.error ?? "Could not submit assessment.");
        return;
      }
      if (body.progress) applyProgress(body.progress);
      setScore(body.score);
      setPassed(body.passed ?? false);
      onDone?.(body.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit assessment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-display text-2xl">{assessment.title}</h2>
      <p className="mt-1 text-sm text-muted">{assessment.description}</p>
      <div className="mt-6">
        <AssessmentMaterials resources={resources} />
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
                    disabled={score !== null || busy}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {score === null ? (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || Object.keys(answers).length < total}
          className="mt-6 rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit assessment"}
        </button>
      ) : (
        <p className="mt-6 rounded-md bg-ember-navy px-4 py-3 text-sm font-semibold text-white">
          Score: {score}% — {passed ? "Pass" : "Needs improvement"} (pass mark{" "}
          {assessment.passMark}%)
        </p>
      )}
    </div>
  );
}

export function pastPaperToScanAssessment(pastPaper: PastPaper): PaperScanAssessment {
  return {
    id: pastPaper.id,
    title: pastPaper.title,
    description: pastPaper.description,
    passMark: pastPaper.passMark,
    resources: pastPaper.resources ?? [],
    memoResources: pastPaper.memoResources ?? [],
    questions: [],
  };
}

export function AssessmentPaperScan({
  assessment,
  studentId,
  onDone,
  practiceOnly = false,
  correctionMode = "paper-scan",
  acceptPdf = false,
  /** Saturday week tests: real memo marking (upload → review → Gemini). */
  realGrading = false,
}: {
  assessment: AssessmentLike | PaperScanAssessment;
  studentId: string;
  onDone?: (score: number) => void;
  /** When true, skip pass/fail progress update (past-paper practice). */
  practiceOnly?: boolean;
  correctionMode?: CorrectionMode;
  /** Allow PDF script uploads in addition to images. */
  acceptPdf?: boolean;
  realGrading?: boolean;
}) {
  const { applyCorrection, applyProgress } = useStore();
  const questions = assessment.questions ?? [];
  const paperOnly = questions.length === 0;
  const allowPdf = acceptPdf || realGrading;
  const [step, setStep] = useState<PaperStep>("questions");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdfPreview, setIsPdfPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CorrectionResult | null>(null);

  const resources = assessment.resources ?? [];

  async function runCorrection() {
    if (!fileName) return;
    if (realGrading && !file) return;
    setBusy(true);
    setError(null);
    try {
      let scanPath: string | undefined;
      if (realGrading && file) {
        const uploaded = await uploadStudentScan({
          studentId,
          assessmentId: assessment.id,
          file,
        });
        if ("error" in uploaded) {
          setError(uploaded.error);
          return;
        }
        scanPath = uploaded.path;
      } else {
        // Mock path: short delay so OCR UX still feels intentional.
        await new Promise((r) => setTimeout(r, 900));
      }

      const res = await fetch("/api/assessments/paper-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          assessmentId: assessment.id,
          fileName,
          scanPath,
          practiceOnly,
          correctionMode,
          studentId,
        }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        correction?: CorrectionResult;
        progress?: StudentProgress | null;
      };
      if (!res.ok || !body.ok || !body.correction) {
        setError(body.error ?? "Could not grade paper scan.");
        return;
      }
      applyCorrection(body.correction);
      if (body.progress) applyProgress(body.progress);
      setResult(body.correction);
      setStep("result");
      onDone?.(body.correction.score);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not grade paper scan.");
    } finally {
      setBusy(false);
    }
  }

  function shareResult(c: CorrectionResult) {
    const label =
      correctionMode === "past-paper" ? "past paper practice" : "paper scan";
    const text = `Ember Maths12 ${label} — ${c.assessmentTitle ?? c.fileName}: ${c.score}%\n${c.summary}`;
    void navigator.clipboard?.writeText(text);
    alert(realGrading ? "Result copied to clipboard." : "Result copied to clipboard (mock share).");
  }

  function onFileChange(next: File | undefined) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!next) {
      setFile(null);
      setFileName("");
      setPreviewUrl(null);
      setIsPdfPreview(false);
      return;
    }
    setFile(next);
    setFileName(next.name);
    const isPdf =
      next.type === "application/pdf" || next.name.toLowerCase().endsWith(".pdf");
    setIsPdfPreview(isPdf);
    setPreviewUrl(URL.createObjectURL(next));
  }

  const stepLabels = realGrading
    ? (paperOnly
        ? ([
            ["questions", "1. Write"],
            ["upload", "2. Scan"],
            ["review", "3. Review"],
            ["result", "4. Feedback"],
          ] as const)
        : ([
            ["questions", "1. Questions"],
            ["upload", "2. Scan"],
            ["review", "3. Review"],
            ["result", "4. Feedback"],
          ] as const))
    : paperOnly
      ? ([
          ["questions", "1. Write"],
          ["upload", "2. Scan"],
          ["result", "3. Feedback"],
        ] as const)
      : ([
          ["questions", "1. Questions"],
          ["upload", "2. Scan"],
          ["result", "3. Feedback"],
        ] as const);

  const fileAccept = allowPdf ? "image/*,.pdf,application/pdf" : "image/*";

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h2 className="font-display text-2xl">{assessment.title}</h2>
      <p className="mt-1 text-sm text-muted">{assessment.description}</p>
      <p className="mt-2 text-xs text-muted">
        {realGrading
          ? "Download the week test paper, write your answers on paper, then photograph or upload a PDF scan. Your script is marked against the admin memo."
          : practiceOnly
            ? "Practice path (demo): download the paper, write answers on paper, then upload a scan for mock AI correction. Does not affect pass/fail."
            : "Paper path (demo): write answers on paper, then upload a scan for mock AI correction."}
      </p>

      <div className="mt-6">
        <AssessmentMaterials resources={resources} />
      </div>

      <ol className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {stepLabels.map(([key, label]) => (
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
          {paperOnly ? (
            <>
              <p className="mb-4 text-sm text-muted">
                {realGrading
                  ? "Download the week test paper above. Write full working on paper (or print the PDF). When you are done, scan your script for marking against the memo."
                  : "Download the past paper above. Write full working on paper (or print the PDF). When you are done, scan your script for mock feedback."}
              </p>
              {resources.length === 0 ? (
                <p className="mb-4 rounded-md border border-ember-gold/40 bg-ember-gold/10 px-3 py-2 text-sm">
                  {realGrading
                    ? "No week test paper uploaded yet. Ask your admin to add a PDF under Admin → Terms → Saturday week test."
                    : "No past paper uploaded yet. Ask your admin to add a previous exam PDF under Admin → Terms → Past papers."}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {realGrading
                  ? "Prefer the uploaded PDF when available. Otherwise copy these questions onto paper and show full working. Options are a reference only."
                  : "Copy these questions onto paper (or print this screen). Show full working. Options are shown as a reference only — write your own answers."}
              </p>
              <div className="space-y-5 print:space-y-4">
                {questions.map((q, idx) => (
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
            </>
          )}
          <button
            type="button"
            onClick={() => setStep("upload")}
            disabled={paperOnly && resources.length === 0}
            className="mt-6 rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy disabled:opacity-50"
          >
            I&apos;m ready to scan
          </button>
        </div>
      ) : null}

      {step === "upload" ? (
        <div>
          <p className="mb-4 text-sm text-muted">
            {realGrading
              ? "Photograph your handwritten pages (rear camera on mobile) or upload a PDF scan of your script."
              : allowPdf
                ? "Photograph your handwritten pages or upload a PDF scan. This demo does not run real OCR — feedback is a mock mark."
                : "Photograph or upload your handwritten page. This demo does not run real OCR — feedback is a mock mark against this assessment’s question bank."}
          </p>
          <label className="block text-sm font-medium">
            {allowPdf ? "Upload page image or PDF" : "Upload page image"}
            <input
              type="file"
              accept={fileAccept}
              capture={allowPdf ? undefined : "environment"}
              className="mt-2 block w-full text-sm"
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
          </label>
          {previewUrl && !isPdfPreview ? (
            /* Blob preview — next/image is not suited to object URLs */
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={previewUrl}
              alt="Scan preview"
              className="mt-4 max-h-64 rounded-md border border-border object-contain"
            />
          ) : null}
          {previewUrl && isPdfPreview && !realGrading ? (
            <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted">
              PDF selected — preview opens after download in a real browser; demo uses the filename
              for mock grading.
            </p>
          ) : null}
          {previewUrl && isPdfPreview && realGrading ? (
            <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted">
              PDF selected — you can review it on the next step before marking.
            </p>
          ) : null}
          {fileName ? <p className="mt-2 text-xs text-muted">Selected: {fileName}</p> : null}
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep("questions")}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
            >
              {paperOnly ? "Back to write" : "Back to questions"}
            </button>
            {realGrading ? (
              <button
                type="button"
                disabled={!file}
                onClick={() => {
                  setError(null);
                  setStep("review");
                }}
                className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Review scan
              </button>
            ) : (
              <button
                type="button"
                disabled={!fileName || busy}
                onClick={() => void runCorrection()}
                className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Analysing…" : "Run AI correction"}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {step === "review" && realGrading ? (
        <div>
          <p className="mb-4 text-sm text-muted">
            Check that your script is clear and upright. Approve to mark against the admin memo, or
            retake to choose another file.
          </p>
          {previewUrl && !isPdfPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
            <img
              src={previewUrl}
              alt="Scan review"
              className="mt-2 max-h-[28rem] w-full rounded-md border border-border object-contain"
            />
          ) : null}
          {previewUrl && isPdfPreview ? (
            <iframe
              title="PDF scan preview"
              src={previewUrl}
              className="mt-2 h-[28rem] w-full rounded-md border border-border bg-surface"
            />
          ) : null}
          {fileName ? <p className="mt-2 text-xs text-muted">Selected: {fileName}</p> : null}
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                onFileChange(undefined);
                setStep("upload");
              }}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
              disabled={busy}
            >
              Retake
            </button>
            <button
              type="button"
              disabled={!file || busy}
              onClick={() => void runCorrection()}
              className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy disabled:opacity-60"
            >
              {busy ? "Marking…" : "Approve and mark"}
            </button>
          </div>
        </div>
      ) : null}

      {step === "result" && result ? (
        <div>
          <p className="rounded-md bg-ember-navy px-4 py-3 text-sm font-semibold text-white">
            Score: {result.score}% —{" "}
            {meetsPassMark(result.score, assessment.passMark) ? "Pass band" : "Needs improvement"} (band{" "}
            {assessment.passMark}%)
            {practiceOnly ? " · practice only" : ""}
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
  /** When true (Saturday week tests), use real memo grading and optional MCQ hide. */
  realGrading = false,
  hideMcq = false,
}: {
  assessment: AssessmentLike;
  studentId: string;
  initialMode?: AssessmentMode;
  onDone?: (score: number) => void;
  realGrading?: boolean;
  /** Hide on-screen MCQ when the week test has no questions. */
  hideMcq?: boolean;
}) {
  const [mode, setMode] = useState<AssessmentMode>(
    hideMcq ? "paper" : initialMode,
  );

  if (hideMcq) {
    return (
      <AssessmentPaperScan
        assessment={assessment}
        studentId={studentId}
        onDone={onDone}
        realGrading={realGrading}
        acceptPdf={realGrading}
      />
    );
  }

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
        <AssessmentPaperScan
          assessment={assessment}
          studentId={studentId}
          onDone={onDone}
          realGrading={realGrading}
          acceptPdf={realGrading}
        />
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
