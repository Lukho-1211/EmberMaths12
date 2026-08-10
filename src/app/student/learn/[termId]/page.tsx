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
      <PageHeader title={term.title} subtitle="Pick a week, then work Mon–Fri. Saturday is test day." />
      <div className="grid gap-4">
        {term.weeks.map((week) => {
          const done = week.lessons.filter((l) =>
            progress?.completedLessonIds.includes(l.id),
          ).length;
          const testScore = progress?.testScores[week.weekTest.id];
          return (
            <Link
              key={week.id}
              href={`/student/learn/${term.id}/${week.id}`}
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
                <span className="text-sm font-semibold text-ember-navy">Open week →</span>
              </div>
            </Link>
          );
        })}
        <Link
          href={`/student/learn/${term.id}/pre-exam`}
          className="rounded-xl border-2 border-ember-gold bg-ember-navy p-5 text-white"
        >
          <h2 className="font-display text-xl">{term.preExam.title}</h2>
          <p className="mt-1 text-sm text-ember-gray">
            Available after Week 4 ·{" "}
            {progress?.testScores[term.preExam.id] !== undefined
              ? `Score ${progress.testScores[term.preExam.id]}%`
              : "Not attempted"}
          </p>
        </Link>
      </div>
    </div>
  );
}
