"use client";

import Link from "next/link";
import { PageHeader, StatCard } from "@/components/app-shell";
import { ProgressRing } from "@/components/assessment";
import { useStore } from "@/lib/store";

export default function StudentDashboardPage() {
  const { user, state } = useStore();
  if (!user) return null;

  const progress = state.progress.find((p) => p.studentId === user.id);
  const badges = state.badges.filter((b) => progress?.badgeIds.includes(b.id));
  const upcoming = state.terms
    .flatMap((term) => term.weeks.map((week) => ({ term, week })))
    .find(({ week }) => progress?.testScores[week.weekTest.id] === undefined);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Your CAPS Grade 12 Maths path — lessons, Saturday tests, and badges."
      />

      <div className="grid gap-4 lg:grid-cols-[auto_1fr_1fr]">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-white p-5">
          <ProgressRing value={progress?.overallPercent ?? 0} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Overall</p>
            <p className="font-display text-2xl capitalize">{progress?.status ?? "pending"}</p>
          </div>
        </div>
        <StatCard
          label="Lessons completed"
          value={progress?.completedLessonIds.length ?? 0}
        />
        <StatCard label="Badges earned" value={badges.length} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Continue learning</h2>
          <p className="mt-2 text-sm text-muted">
            Follow Term → Week → Mon–Fri lessons. Saturday tests and pre-exams can be done on screen
            (MCQ) or with Paper + scan.
          </p>
          <Link
            href="/student/learn"
            className="mt-4 inline-block rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
          >
            Open learn path
          </Link>
          {upcoming ? (
            <p className="mt-4 text-sm">
              Next Saturday test:{" "}
              <Link
                href={`/student/learn/${upcoming.term.id}/${upcoming.week.id}?mode=paper#saturday-test`}
                className="font-semibold text-ember-navy underline decoration-ember-gold"
              >
                {upcoming.week.weekTest.title}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Recent badges</h2>
          <ul className="mt-3 space-y-2">
            {badges.length === 0 ? (
              <li className="text-sm text-muted">Complete a lesson to earn your first badge.</li>
            ) : (
              badges.map((b) => (
                <li key={b.id} className="rounded-md bg-surface px-3 py-2 text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-muted"> — {b.description}</span>
                </li>
              ))
            )}
          </ul>
          <Link href="/student/badges" className="mt-4 inline-block text-sm font-semibold text-ember-navy underline decoration-ember-gold">
            View all badges
          </Link>
        </div>
      </div>
    </div>
  );
}
