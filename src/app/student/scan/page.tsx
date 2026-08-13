"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import type { CorrectionResult } from "@/lib/types";

function mockAiFeedback(fileName: string) {
  const score = 55 + Math.floor(Math.random() * 40);
  return {
    score,
    feedback: [
      "Working is mostly clear; keep aligning equations step by step.",
      "Check the final simplification — a sign error appears near the end.",
      "Good use of the CAPS method for this topic; label each reason in geometry proofs.",
      `File analysed (mock): ${fileName}`,
    ],
    summary:
      score >= 70
        ? "Strong attempt. Review the marked slip and retry similar textbook exercises."
        : "Needs consolidation. Revisit this week’s video and worksheet before the Saturday test.",
  };
}

export default function StudentScanPage() {
  const { user, state, addCorrection } = useStore();
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<CorrectionResult | null>(null);

  const mine = state.corrections.filter((c) => c.studentId === user?.id);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !fileName) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 900));
    const mock = mockAiFeedback(fileName);
    const result = addCorrection({
      studentId: user.id,
      fileName,
      mode: "practice",
      ...mock,
    });
    setLatest(result);
    setBusy(false);
  }

  function shareResult(c: CorrectionResult) {
    const label = c.assessmentTitle ?? c.fileName;
    const text = `EmberMaths12 AI correction — ${label}: ${c.score}%\n${c.summary}`;
    void navigator.clipboard?.writeText(text);
    alert("Result copied to clipboard (mock share).");
  }

  function historyLabel(c: CorrectionResult) {
    if (c.assessmentTitle) {
      return `${c.assessmentTitle} · ${c.fileName} · ${c.score}%`;
    }
    return `${c.fileName} · ${c.score}%`;
  }

  return (
    <div>
      <PageHeader
        title="Scan & correct"
        subtitle="Ad-hoc practice upload for mock AI corrections. For term past exam papers, use Past papers. Week tests and pre-exams use Paper + scan on the learn path."
      />

      <p className="mb-4 rounded-xl border border-border bg-white px-4 py-3 text-sm">
        Prefer a full previous exam?{" "}
        <Link
          href="/student/past-papers"
          className="font-semibold text-ember-navy underline decoration-ember-gold"
        >
          Open Past papers
        </Link>{" "}
        — download the PDF, write on paper, then scan for memo-aware feedback.
      </p>

      <form
        onSubmit={onSubmit}
        className="rounded-xl border border-dashed border-ember-navy/30 bg-white p-6"
      >
        <label className="block text-sm font-medium">
          Upload page image
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="mt-2 block w-full text-sm"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Analysing…" : "Run AI correction"}
        </button>
      </form>

      {latest ? (
        <div className="mt-6 rounded-xl border border-ember-gold bg-white p-5">
          <h2 className="font-display text-2xl">Latest result · {latest.score}%</h2>
          <p className="mt-2 text-sm">{latest.summary}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
            {latest.feedback.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => shareResult(latest)}
            className="mt-4 rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
          >
            Share results
          </button>
        </div>
      ) : null}

      {mine.length > 0 ? (
        <div className="mt-8">
          <h2 className="font-semibold">History</h2>
          <ul className="mt-3 space-y-2">
            {mine.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-white px-4 py-3 text-sm"
              >
                <span>
                  {historyLabel(c)}
                  {c.mode === "paper-scan" ? (
                    <span className="ml-2 text-xs uppercase text-muted">paper scan</span>
                  ) : null}
                  {c.mode === "past-paper" ? (
                    <span className="ml-2 text-xs uppercase text-muted">past paper</span>
                  ) : null}
                </span>
                <button type="button" className="shrink-0 text-ember-navy underline" onClick={() => shareResult(c)}>
                  Share
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
