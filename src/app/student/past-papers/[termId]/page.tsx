"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import {
  AssessmentPaperScan,
  pastPaperToScanAssessment,
} from "@/components/assessment";
import { useStore } from "@/lib/store";

export default function StudentPastPaperTermPage() {
  const params = useParams<{ termId: string }>();
  const { user, state } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);

  if (!user) return null;

  if (!term?.pastPaper) {
    return (
      <div>
        <PageHeader title="Past papers" subtitle="Term pack not found." />
        <Link href="/student/past-papers" className="text-sm font-semibold underline">
          ← All past papers
        </Link>
      </div>
    );
  }

  const pack = term.pastPaper;
  const history = state.corrections.filter(
    (c) =>
      c.studentId === user.id &&
      c.mode === "past-paper" &&
      c.assessmentId === pack.id,
  );

  return (
    <div>
      <PageHeader
        title={pack.title}
        subtitle={`${term.title} · optional practice (does not affect pass/fail)`}
      />
      <Link
        href="/student/past-papers"
        className="mb-4 inline-block text-sm font-semibold text-ember-navy underline decoration-ember-gold"
      >
        ← All past papers
      </Link>

      {(pack.resources?.length ?? 0) === 0 ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-muted">
          No past paper uploaded for this term yet. Ask your admin to upload a previous exam PDF
          under Admin → Terms → Past papers.
        </p>
      ) : (
        <AssessmentPaperScan
          assessment={pastPaperToScanAssessment(pack)}
          studentId={user.id}
          practiceOnly
          correctionMode="past-paper"
          acceptPdf
        />
      )}

      {history.length > 0 ? (
        <div className="mt-8">
          <h2 className="font-semibold">Your attempts</h2>
          <ul className="mt-3 space-y-2">
            {history.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-white px-4 py-3 text-sm"
              >
                <span>
                  {c.fileName} · <strong>{c.score}%</strong>
                </span>
                <span className="text-xs text-muted">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
