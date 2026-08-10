"use client";

import { useMemo, useState } from "react";
import { Download, FileText } from "lucide-react";
import { decodeMarkdownResource } from "@/lib/lesson-file";
import { useStore } from "@/lib/store";
import type { PreExam, Resource, WeekTest } from "@/lib/types";

function AssessmentMaterials({ resources }: { resources: Resource[] }) {
  const [openMarkdownId, setOpenMarkdownId] = useState<string | null>(null);
  if (resources.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-dashed border-border bg-surface/50 p-4">
      <h3 className="text-sm font-semibold">Exam paper / materials</h3>
      <p className="mt-1 text-xs text-muted">Download the PDF or view the Markdown paper before answering.</p>
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
                {open ? <MarkdownPreview resource={r} /> : null}
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

function MarkdownPreview({ resource }: { resource: Resource }) {
  const text = useMemo(() => decodeMarkdownResource(resource.url), [resource.url]);
  if (!text) {
    return (
      <a
        href={resource.url}
        download={resource.fileName ?? `${resource.title}.md`}
        className="text-sm font-medium text-ember-navy underline decoration-ember-gold"
      >
        Download {resource.title}
      </a>
    );
  }
  return (
    <article className="rounded-lg border border-border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Markdown</p>
        <a
          href={resource.url}
          download={resource.fileName ?? `${resource.title}.md`}
          className="text-xs font-semibold text-ember-navy underline decoration-ember-gold"
        >
          Download
        </a>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ember-navy">
        {text}
      </pre>
    </article>
  );
}

export function AssessmentQuiz({
  assessment,
  studentId,
  onDone,
}: {
  assessment: WeekTest | PreExam;
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
