"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Download, ExternalLink, FileText, Video } from "lucide-react";
import { AssessmentPanel } from "@/components/assessment";
import { PageHeader } from "@/components/app-shell";
import { LessonVideoPlayer } from "@/components/lesson-video-player";
import { PdfNotesPreview } from "@/components/pdf-notes-preview";
import { TermWeekNav } from "@/components/term-week-nav";
import { WeekDayNav } from "@/components/week-day-nav";
import { lessonTextResources } from "@/lib/lesson-file";
import { hasVideoSources, isDirectVideoUrl } from "@/lib/lesson-video";
import { meetsPassMark } from "@/lib/score-mcq";
import { useStore } from "@/lib/store";
import type { LessonTest, Resource, WeekDay } from "@/lib/types";

function resourceHref(r: Resource) {
  return r.url === "#" ? undefined : r.url;
}

function assessmentForLesson(
  lessonTest: LessonTest,
  lessonResources: Resource[],
): LessonTest {
  if (lessonTest.resources.length > 0) return lessonTest;
  return { ...lessonTest, resources: lessonResources };
}

function StudentLessonContent() {
  const params = useParams<{ termId: string; weekId: string; day: string }>();
  const searchParams = useSearchParams();
  const { state, user, completeLesson } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const week = term?.weeks.find((w) => w.id === params.weekId);
  const lesson = week?.lessons.find((l) => l.day === (params.day as WeekDay));
  const progress = state.progress.find((p) => p.studentId === user?.id);
  const done = lesson ? progress?.completedLessonIds.includes(lesson.id) : false;
  const [viewMode, setViewMode] = useState<"video" | "text">("video");
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  if (!term || !week || !lesson || !user) return <p>Lesson not found.</p>;

  const textResources = lessonTextResources(lesson);
  const hostedVideoUrl = isDirectVideoUrl(lesson.videoUrl) ? lesson.videoUrl : null;
  const useLessonPlayer = Boolean(hostedVideoUrl) || hasVideoSources(lesson.resources);
  const lessonTest = lesson.lessonTest;
  const score =
    lessonTest && progress?.testScores[lessonTest.id] !== undefined
      ? progress.testScores[lessonTest.id]
      : null;
  const passed =
    lessonTest != null && score != null && meetsPassMark(score, lessonTest.passMark);
  const canComplete = !lessonTest || passed;
  const initialMode = searchParams.get("mode") === "paper" ? "paper" : "mcq";
  const studentResources = lesson.resources.filter((r) => r.type !== "markdown");

  return (
    <div>
      <TermWeekNav termId={term.id} weeks={term.weeks} activeWeekId={week.id} />
      <WeekDayNav
        termId={term.id}
        weekId={week.id}
        lessons={week.lessons}
        activeDay={lesson.day}
      />

      <PageHeader title={lesson.title} subtitle={`${term.title} · Week ${week.number} · ${lesson.day}`} />

      <div
        role="tablist"
        aria-label="Lesson view"
        className="mb-4 flex flex-wrap gap-2"
      >
        <button
          type="button"
          role="tab"
          id="lesson-tab-video"
          aria-selected={viewMode === "video"}
          aria-controls="lesson-panel-main"
          onClick={() => setViewMode("video")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
            viewMode === "video"
              ? "bg-ember-gold font-semibold text-ember-navy"
              : "bg-ember-gray text-ember-navy"
          }`}
        >
          <Video size={14} aria-hidden />
          Video
        </button>
        <button
          type="button"
          role="tab"
          id="lesson-tab-text"
          aria-selected={viewMode === "text"}
          aria-controls="lesson-panel-main"
          onClick={() => setViewMode("text")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
            viewMode === "text"
              ? "bg-ember-gold font-semibold text-ember-navy"
              : "bg-ember-gray text-ember-navy"
          }`}
        >
          <FileText size={14} aria-hidden />
          Text
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div id="lesson-panel-main" role="tabpanel" aria-labelledby={`lesson-tab-${viewMode}`}>
            {viewMode === "video" ? (
              useLessonPlayer ? (
                <LessonVideoPlayer
                  title={lesson.title}
                  resources={lesson.resources}
                  hostedVideoUrl={hostedVideoUrl}
                />
              ) : lesson.videoUrl.trim() ? (
                <div className="aspect-video overflow-hidden rounded-xl border border-border bg-ember-navy">
                  <iframe
                    title={lesson.title}
                    src={lesson.videoUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="grid aspect-video place-items-center rounded-xl border border-border bg-ember-navy px-4 text-center text-sm text-white/80">
                  No lesson video yet. Admin can upload an MP4, or attach a PDF for a
                  walkthrough.
                </div>
              )
            ) : textResources.length > 0 ? (
              <div className="space-y-4">
                {textResources.map((resource) => (
                  <PdfNotesPreview
                    key={resource.id}
                    resource={resource}
                    className="rounded-xl border border-border bg-white p-4"
                  />
                ))}
              </div>
            ) : (
              <article className="rounded-xl border border-border bg-white p-4">
                <p className="text-sm leading-relaxed text-ember-navy">{lesson.description}</p>
                <p className="mt-3 text-xs text-muted">
                  Full text notes appear here when Admin uploads a PDF for this lesson.
                </p>
              </article>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted">{lesson.description}</p>
          <p className="text-xs text-muted">Duration ≈ {lesson.durationMinutes} minutes</p>

          {lessonTest ? (
            <section id="lesson-test" className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-display text-xl">{lessonTest.title}</h2>
              <p className="mt-1 text-sm text-muted">{lessonTest.description}</p>
              {score != null ? (
                <p className="mt-2 text-sm">
                  Latest score:{" "}
                  <span className={passed ? "font-semibold text-success" : "font-semibold text-danger"}>
                    {score}%
                  </span>
                  {passed ? " · passed" : ` · need ${lessonTest.passMark}% to complete`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  Pass mark {lessonTest.passMark}% — required before you can mark this lesson complete.
                </p>
              )}
              <div className="mt-4">
                <AssessmentPanel
                  assessment={assessmentForLesson(lessonTest, studentResources)}
                  studentId={user.id}
                  initialMode={initialMode}
                />
              </div>
            </section>
          ) : null}

          {!done ? (
            <div className="space-y-2">
              <button
                type="button"
                disabled={!canComplete || completing}
                onClick={() => {
                  setCompleteError(null);
                  setCompleting(true);
                  void completeLesson(user.id, lesson.id).then((result) => {
                    setCompleting(false);
                    if (!result.ok) setCompleteError(result.error);
                  });
                }}
                className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {completing ? "Saving…" : "Mark lesson complete"}
              </button>
              {!canComplete ? (
                <p className="text-xs text-muted">Pass today’s lesson test to complete.</p>
              ) : null}
              {completeError ? <p className="text-xs text-danger">{completeError}</p> : null}
            </div>
          ) : (
            <p className="text-sm font-semibold text-success">Lesson completed</p>
          )}
        </div>

        <aside className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Resources</h2>
          <ul className="mt-4 space-y-3">
            {studentResources.map((r) => {
              const href = resourceHref(r);
              const isUploaded = Boolean(
                href &&
                  (href.startsWith("data:") ||
                    href.startsWith("http://") ||
                    href.startsWith("https://")),
              );

              return (
                <li key={r.id}>
                  <a
                    href={href ?? "#"}
                    className="flex items-start gap-2 text-sm hover:text-ember-gold"
                    download={
                      r.type === "pdf" || r.type === "worksheet"
                        ? r.fileName ?? true
                        : undefined
                    }
                    target={r.type === "link" || (r.type === "pdf" && isUploaded) ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={(e) => {
                      if (!href) {
                        e.preventDefault();
                        alert("Placeholder resource — connect real files when the backend is ready.");
                      }
                    }}
                  >
                    {r.type === "link" ? <ExternalLink size={16} /> : <Download size={16} />}
                    <span>
                      <span className="block font-medium">{r.title}</span>
                      <span className="text-xs uppercase text-muted">{r.type}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          <Link
            href={`/student/learn/${term.id}/${week.id}`}
            className="mt-6 inline-block text-sm font-semibold underline decoration-ember-gold"
          >
            ← Back to week
          </Link>
        </aside>
      </div>
    </div>
  );
}

export default function StudentLessonPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <StudentLessonContent />
    </Suspense>
  );
}
