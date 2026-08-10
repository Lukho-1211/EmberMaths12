"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { TermWeekNav } from "@/components/term-week-nav";
import { decodeMarkdownResource } from "@/lib/lesson-file";
import { useStore } from "@/lib/store";
import type { Resource, WeekDay } from "@/lib/types";

function resourceHref(r: Resource) {
  return r.url === "#" ? undefined : r.url;
}

function MarkdownPreview({ resource }: { resource: Resource }) {
  const text = useMemo(() => decodeMarkdownResource(resource.url), [resource.url]);
  if (!text) {
    return (
      <a
        href={resource.url}
        download={resource.fileName ?? `${resource.title}.md`}
        className="text-sm font-medium text-ember-navy underline decoration-ember-gold"
      >
        Download {resource.title}
      </a>
    );
  }
  return (
    <article className="rounded-lg border border-border bg-surface/50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Markdown</p>
        <a
          href={resource.url}
          download={resource.fileName ?? `${resource.title}.md`}
          className="text-xs font-semibold text-ember-navy underline decoration-ember-gold"
        >
          Download
        </a>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ember-navy">
        {text}
      </pre>
    </article>
  );
}

export default function StudentLessonPage() {
  const params = useParams<{ termId: string; weekId: string; day: string }>();
  const { state, user, completeLesson } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const week = term?.weeks.find((w) => w.id === params.weekId);
  const lesson = week?.lessons.find((l) => l.day === (params.day as WeekDay));
  const progress = state.progress.find((p) => p.studentId === user?.id);
  const done = lesson ? progress?.completedLessonIds.includes(lesson.id) : false;
  const [openMarkdownId, setOpenMarkdownId] = useState<string | null>(null);

  if (!term || !week || !lesson || !user) return <p>Lesson not found.</p>;

  return (
    <div>
      <TermWeekNav termId={term.id} weeks={term.weeks} activeWeekId={week.id} />

      <PageHeader title={lesson.title} subtitle={`${term.title} · Week ${week.number} · ${lesson.day}`} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-xl border border-border bg-ember-navy">
            <iframe
              title={lesson.title}
              src={lesson.videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-sm leading-relaxed text-muted">{lesson.description}</p>
          <p className="text-xs text-muted">Duration ≈ {lesson.durationMinutes} minutes</p>
          {!done ? (
            <button
              type="button"
              onClick={() => completeLesson(user.id, lesson.id)}
              className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
            >
              Mark lesson complete
            </button>
          ) : (
            <p className="text-sm font-semibold text-success">Lesson completed</p>
          )}

          {openMarkdownId ? (
            <div className="space-y-2">
              {lesson.resources
                .filter((r) => r.id === openMarkdownId && r.type === "markdown")
                .map((r) => (
                  <MarkdownPreview key={r.id} resource={r} />
                ))}
            </div>
          ) : null}
        </div>

        <aside className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Resources</h2>
          <ul className="mt-4 space-y-3">
            {lesson.resources.map((r) => {
              const href = resourceHref(r);
              const isUploaded = Boolean(href?.startsWith("data:"));
              const isMarkdown = r.type === "markdown";

              if (isMarkdown && isUploaded) {
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMarkdownId((id) => (id === r.id ? null : r.id))
                      }
                      className="flex w-full items-start gap-2 text-left text-sm hover:text-ember-gold"
                    >
                      <FileText size={16} className="mt-0.5 shrink-0" />
                      <span>
                        <span className="block font-medium">{r.title}</span>
                        <span className="text-xs uppercase text-muted">
                          markdown · {openMarkdownId === r.id ? "hide" : "view"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={r.id}>
                  <a
                    href={href ?? "#"}
                    className="flex items-start gap-2 text-sm hover:text-ember-gold"
                    download={
                      r.type === "pdf" || r.type === "worksheet" || r.type === "markdown"
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
