"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import type { WeekDay } from "@/lib/types";

export default function StudentLessonPage() {
  const params = useParams<{ termId: string; weekId: string; day: string }>();
  const { state, user, completeLesson } = useStore();
  const term = state.terms.find((t) => t.id === params.termId);
  const week = term?.weeks.find((w) => w.id === params.weekId);
  const lesson = week?.lessons.find((l) => l.day === (params.day as WeekDay));
  const progress = state.progress.find((p) => p.studentId === user?.id);
  const done = lesson ? progress?.completedLessonIds.includes(lesson.id) : false;

  if (!term || !week || !lesson || !user) return <p>Lesson not found.</p>;

  return (
    <div>
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
        </div>

        <aside className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold">Resources</h2>
          <ul className="mt-4 space-y-3">
            {lesson.resources.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url}
                  className="flex items-start gap-2 text-sm hover:text-ember-gold"
                  download={r.type === "pdf" || r.type === "worksheet" ? true : undefined}
                  target={r.type === "link" ? "_blank" : undefined}
                  rel="noreferrer"
                  onClick={(e) => {
                    if (r.url === "#") {
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
            ))}
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
