"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { TermWeekNav } from "@/components/term-week-nav";
import { AssessmentQuiz } from "@/components/assessment";
import { useStore } from "@/lib/store";

export default function StudentPreExamPage() {
  const params = useParams<{ termId: string }>();
  const { state, user } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const progress = state.progress.find((p) => p.studentId === user?.id);

  if (!term || !user) return <p>Term not found.</p>;

  const weeksComplete = term.weeks.every((w) =>
    w.lessons.every((l) => progress?.completedLessonIds.includes(l.id)),
  );

  return (
    <div>
      <TermWeekNav termId={term.id} weeks={term.weeks} preExamActive />

      <PageHeader
        title={term.preExam.title}
        subtitle="Taken after Week 4 to consolidate the term."
      />
      {!weeksComplete ? (
        <p className="mb-4 rounded-md border border-ember-gold/40 bg-ember-gold/10 px-4 py-3 text-sm">
          Tip: finish all Week 1–4 lessons for the best result. You can still attempt the pre-exam
          now.
        </p>
      ) : null}
      <AssessmentQuiz assessment={term.preExam} studentId={user.id} />
      <Link
        href={`/student/learn/${term.id}`}
        className="mt-6 inline-block text-sm font-semibold underline decoration-ember-gold"
      >
        ← Back to term
      </Link>
    </div>
  );
}
