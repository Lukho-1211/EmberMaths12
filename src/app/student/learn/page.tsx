"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function StudentLearnIndexPage() {
  const { state, user } = useStore();
  const progress = state.progress.find((p) => p.studentId === user?.id);

  return (
    <div>
      <PageHeader
        title="Learn"
        subtitle="Choose a term. Each term has weekly lessons (Mon–Fri + Saturday test) and a pre-exam — take assessments on screen (MCQ) or via Paper + scan."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {state.terms.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-ember-white p-5 text-sm text-muted md:col-span-2">
            No terms published yet. Check back after an admin adds curriculum on Terms &amp; weekly
            lessons.
          </p>
        ) : null}
        {state.terms.map((term) => {
          const weeksDone = term.weeks.filter((w) =>
            w.lessons.every((l) => progress?.completedLessonIds.includes(l.id)),
          ).length;
          const preScore = progress?.testScores[term.preExam.id];
          const hasWeeks = term.weeks.length > 0;
          return (
            <Link
              key={term.id}
              href={`/student/learn/${term.id}`}
              className="rounded-xl border border-border bg-ember-white p-5 text-foreground transition hover:border-ember-gold"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Term {term.number}
              </p>
              <h2 className="mt-1 font-display text-2xl text-foreground">{term.title}</h2>
              <p className="mt-3 text-sm text-muted">
                {!hasWeeks
                  ? "Waiting for admin to publish this term"
                  : `${weeksDone}/${term.weeks.length} weeks complete${
                      preScore !== undefined ? ` · Pre-exam ${preScore}%` : " · Pre-exam pending"
                    }`}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
