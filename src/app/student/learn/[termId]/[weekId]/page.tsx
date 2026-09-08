"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { TermWeekNav } from "@/components/term-week-nav";
import { WeekDayNav } from "@/components/week-day-nav";
import { AssessmentPanel } from "@/components/assessment";
import { useStore } from "@/lib/store";

function hasUploadedPaper(resources: { type: string; url: string }[]) {
  return resources.some(
    (r) =>
      r.type === "pdf" &&
      (r.url.startsWith("http://") ||
        r.url.startsWith("https://") ||
        r.url.startsWith("data:")),
  );
}

function StudentWeekContent() {
  const params = useParams<{ termId: string; weekId: string }>();
  const searchParams = useSearchParams();
  const { state, user } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const week = term?.weeks.find((w) => w.id === params.weekId);
  const progress = state.progress.find((p) => p.studentId === user?.id);

  if (!term || !week || !user) return <p>Week not found.</p>;

  const paperUploaded = hasUploadedPaper(week.weekTest.resources ?? []);
  const hideMcq = (week.weekTest.questions?.length ?? 0) === 0;
  const modeParam = searchParams.get("mode");
  const initialMode =
    hideMcq || modeParam === "paper" || (paperUploaded && modeParam !== "mcq")
      ? "paper"
      : "mcq";

  return (
    <div>
      <TermWeekNav termId={term.id} weeks={term.weeks} activeWeekId={week.id} />
      <WeekDayNav termId={term.id} weekId={week.id} lessons={week.lessons} />

      <PageHeader
        title={`Week ${week.number}: ${week.topic}`}
        subtitle={`${term.title} · Mon–Fri lessons, then Saturday week test`}
      />

      <div className="mb-6 grid gap-3">
        {week.lessons.map((lesson) => {
          const done = progress?.completedLessonIds.includes(lesson.id);
          return (
            <Link
              key={lesson.id}
              href={`/student/learn/${term.id}/${week.id}/${lesson.day}`}
              className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 hover:border-ember-gold"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">{lesson.day}</p>
                <p className="font-medium">{lesson.title}</p>
              </div>
              <span className={`text-xs font-semibold ${done ? "text-success" : "text-muted"}`}>
                {done ? "Completed" : "Open"}
              </span>
            </Link>
          );
        })}
      </div>

      <div id="saturday-test">
        <h2 className="mb-3 font-display text-2xl">Saturday · Week test</h2>
        {progress?.testScores[week.weekTest.id] !== undefined ? (
          <p className="mb-4 rounded-md bg-surface px-4 py-3 text-sm">
            Already submitted — score {progress.testScores[week.weekTest.id]}%. Retake below to
            update.
          </p>
        ) : null}
        <AssessmentPanel
          assessment={week.weekTest}
          studentId={user.id}
          initialMode={initialMode}
          realGrading
          hideMcq={hideMcq}
        />
      </div>

      <Link
        href={`/student/learn/${term.id}`}
        className="mt-6 inline-block text-sm font-semibold text-ember-navy underline decoration-ember-gold"
      >
        ← Back to term
      </Link>
    </div>
  );
}

export default function StudentWeekPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <StudentWeekContent />
    </Suspense>
  );
}
