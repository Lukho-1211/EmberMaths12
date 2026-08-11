"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function StudentTermPage() {
  const params = useParams<{ termId: string }>();
  const { state, user } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const progress = state.progress.find((p) => p.studentId === user?.id);

  if (!term) {
    return <p>Term not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title={term.title}
        subtitle="Pick a week, then work Mon–Fri. Saturday tests and the pre-exam support on-screen MCQ or Paper + scan."
      />
      <div className="grid gap-4">
        {term.weeks.map((week) => {
          const done = week.lessons.filter((l) =>
            progress?.completedLessonIds.includes(l.id),
          ).length;
          const testScore = progress?.testScores[week.weekTest.id];
          return (
            <div
              key={week.id}
              className="rounded-xl border border-border bg-white p-5 hover:border-ember-gold"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl">
                    Week {week.number}: {week.topic}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {done}/5 lessons · Saturday test
                    {testScore !== undefined ? ` scored ${testScore}%` : " not taken"}
                  </p>
                </div>
                <Link
                  href={`/student/learn/${term.id}/${week.id}`}
                  className="text-sm font-semibold text-ember-navy"
                >
                  Open week →
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                <Link
                  href={`/student/learn/${term.id}/${week.id}#saturday-test`}
                  className="text-ember-navy underline decoration-ember-gold"
                >
                  Saturday test (MCQ)
                </Link>
                <Link
                  href={`/student/learn/${term.id}/${week.id}?mode=paper#saturday-test`}
                  className="text-ember-navy underline decoration-ember-gold"
                >
                  Paper + scan
                </Link>
              </div>
            </div>
          );
        })}
        <div className="rounded-xl border-2 border-ember-gold bg-ember-navy p-5 text-white">
          <Link href={`/student/learn/${term.id}/pre-exam`} className="block">
            <h2 className="font-display text-xl">{term.preExam.title}</h2>
            <p className="mt-1 text-sm text-ember-gray">
              Available after Week 4 ·{" "}
              {progress?.testScores[term.preExam.id] !== undefined
                ? `Score ${progress.testScores[term.preExam.id]}%`
                : "Not attempted"}
            </p>
          </Link>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            <Link
              href={`/student/learn/${term.id}/pre-exam`}
              className="text-ember-gold underline"
            >
              Pre-exam (MCQ)
            </Link>
            <Link
              href={`/student/learn/${term.id}/pre-exam?mode=paper`}
              className="text-ember-gold underline"
            >
              Paper + scan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
