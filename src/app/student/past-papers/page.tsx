"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function StudentPastPapersPage() {
  const { user, state } = useStore();
  if (!user) return null;

  const mine = state.corrections.filter(
    (c) => c.studentId === user.id && c.mode === "past-paper",
  );

  return (
    <div>
      <PageHeader
        title="Past papers"
        subtitle="Practice previous exam papers each term. Write on paper, scan your script, and get mock AI feedback — separate from pass/fail."
      />

      <div className="grid gap-4">
        {state.terms.map((term) => {
          const pack = term.pastPaper;
          const ready = (pack?.resources?.length ?? 0) > 0;
          const last = mine.find((c) => c.assessmentId === pack?.id);
          return (
            <div
              key={term.id}
              className="rounded-xl border border-border bg-white p-5 hover:border-ember-gold"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">{pack?.title ?? term.title}</h2>
                  <p className="mt-1 text-sm text-muted">{term.title}</p>
                  <p className="mt-2 text-sm">
                    {!ready ? (
                      <span className="text-muted">Not uploaded yet — check back after admin adds a paper.</span>
                    ) : last ? (
                      <span>
                        Ready · last practice score <strong>{last.score}%</strong>
                      </span>
                    ) : (
                      <span className="text-ember-navy font-medium">Ready to practice</span>
                    )}
                  </p>
                </div>
                {ready ? (
                  <Link
                    href={`/student/past-papers/${term.id}`}
                    className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
                  >
                    Open pack →
                  </Link>
                ) : (
                  <span className="rounded-md border border-border px-4 py-2 text-sm text-muted">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
