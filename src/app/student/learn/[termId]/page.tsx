"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { TermInsightsPanel } from "@/components/term-insights";
import { hasRealMcqQuestions } from "@/lib/domain/placeholder-mcq";
import { buildAllTermInsights } from "@/lib/term-insights";
import { useStore } from "@/lib/store";

export default function StudentTermPage() {
  const params = useParams<{ termId: string }>();
  const { state, user } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const progress = state.progress.find((p) => p.studentId === user?.id);
  const insights = buildAllTermInsights(
    state.terms,
    progress,
    state.corrections.filter((c) => c.studentId === user?.id),
  );

  if (!term) {
    return <p>Term not found.</p>;
  }

  return (
    <div>
      <PageHeader
        title={term.title}
        subtitle={
          term.weeks.some((w) => hasRealMcqQuestions(w.weekTest.questions)) ||
          hasRealMcqQuestions(term.preExam.questions)
            ? "Pick a week, then work Mon–Fri. Saturday tests and the pre-exam support on-screen MCQ or Paper + scan when admin has uploaded questions."
            : "Pick a week, then work Mon–Fri. Saturday tests and the pre-exam use Paper + scan until admin uploads on-screen MCQ questions."
        }
      />
      <div className="mb-8">
        <TermInsightsPanel
          insights={insights}
          showLinks
          termFilter={term.id}
          title="This term — strengths and gaps"
          subtitle="Strong and weak topics for this term, plus where to improve next."
        />
      </div>
      <div className="grid gap-4">
        {term.weeks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-ember-white p-5 text-sm text-muted">
            Waiting for admin to publish this term — no weeks yet.
          </p>
        ) : null}
        {term.weeks.map((week) => {
          const done = week.lessons.filter((l) =>
            progress?.completedLessonIds.includes(l.id),
          ).length;
          const testScore = progress?.testScores[week.weekTest.id];
          const hasMcq = hasRealMcqQuestions(week.weekTest.questions);
          return (
            <div
              key={week.id}
              className="rounded-xl border border-border bg-ember-white p-5 hover:border-ember-gold"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl text-foreground">
                    Week {week.number}: {week.topic}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {done}/5 lessons · Saturday test
                    {testScore !== undefined ? ` scored ${testScore}%` : " not taken"}
                  </p>
                </div>
                <Link
                  href={`/student/learn/${term.id}/${week.id}`}
                  className="inline-flex items-center rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
                >
                  Open week →
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-3">
                {hasMcq ? (
                  <Link
                    href={`/student/learn/${term.id}/${week.id}#saturday-test`}
                    className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
                  >
                    Saturday test (MCQ)
                  </Link>
                ) : null}
                <Link
                  href={`/student/learn/${term.id}/${week.id}?mode=paper#saturday-test`}
                  className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground"
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
              {term.weeks.length > 0
                ? `Available after Week ${Math.max(...term.weeks.map((w) => w.number))} · `
                : "Available after the term’s weeks · "}
              {progress?.testScores[term.preExam.id] !== undefined
                ? `Score ${progress.testScores[term.preExam.id]}%`
                : "Not attempted"}
            </p>
          </Link>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
            {hasRealMcqQuestions(term.preExam.questions) ? (
              <Link
                href={`/student/learn/${term.id}/pre-exam`}
                className="text-ember-gold underline"
              >
                Pre-exam (MCQ)
              </Link>
            ) : null}
            <Link
              href={`/student/learn/${term.id}/pre-exam?mode=paper`}
              className="text-ember-gold underline"
            >
              Paper + scan
            </Link>
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-ember-navy/30 bg-ember-white p-5">
          <h2 className="font-display text-xl text-foreground">{term.pastPaper.title}</h2>
          <p className="mt-1 text-sm text-muted">
            Optional practice ·{" "}
            {(term.pastPaper.resources?.length ?? 0) > 0
              ? "Paper ready — write, scan, get feedback"
              : "Waiting for admin upload"}
          </p>
          <Link
            href={`/student/past-papers/${term.id}`}
            className="mt-3 inline-block text-sm font-semibold text-foreground underline decoration-ember-gold"
          >
            Practice past papers →
          </Link>
        </div>
      </div>
    </div>
  );
}
