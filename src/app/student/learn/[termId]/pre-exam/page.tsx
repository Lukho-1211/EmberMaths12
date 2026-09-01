"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { TermWeekNav } from "@/components/term-week-nav";
import { AssessmentPanel } from "@/components/assessment";
import { useStore } from "@/lib/store";

function StudentPreExamContent() {
  const params = useParams<{ termId: string }>();
  const searchParams = useSearchParams();
  const { state, user } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const progress = state.progress.find((p) => p.studentId === user?.id);
  const initialMode = searchParams.get("mode") === "paper" ? "paper" : "mcq";

  if (!term || !user) return <p>Term not found.</p>;

  const weeksComplete = term.weeks.every((w) =>
    w.lessons.every((l) => progress?.completedLessonIds.includes(l.id)),
  );

  return (
    <div>
      <TermWeekNav termId={term.id} weeks={term.weeks} preExamActive />

      <PageHeader
        title={term.preExam.title}
        subtitle={
          term.weeks.length > 0
            ? `Taken after Week ${Math.max(...term.weeks.map((w) => w.number))} to consolidate the term.`
            : "Taken after the term’s weeks to consolidate the term."
        }
      />
      {!weeksComplete ? (
        <p className="mb-4 rounded-md border border-ember-gold/40 bg-ember-gold/10 px-4 py-3 text-sm">
          Tip: finish all lessons in this term for the best result. You can still attempt the
          pre-exam now.
        </p>
      ) : null}
      <AssessmentPanel
        assessment={term.preExam}
        studentId={user.id}
        initialMode={initialMode}
      />
      <Link
        href={`/student/learn/${term.id}`}
        className="mt-6 inline-block text-sm font-semibold underline decoration-ember-gold"
      >
        ← Back to term
      </Link>
    </div>
  );
}

export default function StudentPreExamPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <StudentPreExamContent />
    </Suspense>
  );
}
