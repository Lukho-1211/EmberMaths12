"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import type { WeekDay } from "@/lib/types";

const DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export default function TeacherLessonsPage() {
  const { user, state, createTeacherLesson } = useStore();
  const myClasses = state.classes.filter((c) => c.teacherId === user?.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState<WeekDay>("monday");
  const [classId, setClassId] = useState(myClasses[0]?.id ?? "");
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    createTeacherLesson({
      day,
      title,
      description,
      videoUrl,
      durationMinutes: 30,
      resources: [
        {
          id: `tr-${crypto.randomUUID().slice(0, 6)}`,
          title: "Teacher worksheet",
          type: "worksheet",
          url: "#",
        },
      ],
      createdByTeacherId: user.id,
      classId: classId || undefined,
    });
    setTitle("");
    setDescription("");
  }

  const mine = state.teacherLessons.filter((l) => l.createdByTeacherId === user?.id);

  return (
    <div>
      <PageHeader
        title="Teacher lessons"
        subtitle="Create lessons for your classes. These sit alongside the CAPS term map."
      />

      <form
        onSubmit={onSubmit}
        className="mb-8 grid gap-3 rounded-xl border border-border bg-white p-5 md:grid-cols-2"
      >
        <input
          className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
        />
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={day}
          onChange={(e) => setDay(e.target.value as WeekDay)}
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">No class</option>
          {myClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
          placeholder="Video embed URL"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white md:w-fit"
        >
          Publish lesson
        </button>
      </form>

      <div className="space-y-3">
        {mine.length === 0 ? (
          <p className="text-sm text-muted">No teacher-created lessons yet.</p>
        ) : (
          mine.map((l) => (
            <div key={l.id} className="rounded-xl border border-border bg-white px-4 py-3">
              <p className="text-xs uppercase text-muted">{l.day}</p>
              <p className="font-medium">{l.title}</p>
              <p className="text-sm text-muted">{l.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
