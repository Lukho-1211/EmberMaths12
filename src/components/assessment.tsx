"use client";

import { useMemo, useState } from "react";
import type { PreExam, WeekTest } from "@/lib/types";
import { useStore } from "@/lib/store";

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
      <div className="mt-6 space-y-6">
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
