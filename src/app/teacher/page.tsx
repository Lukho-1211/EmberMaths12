"use client";

import Link from "next/link";
import { PageHeader, StatCard } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function TeacherDashboardPage() {
  const { user, state } = useStore();
  if (!user) return null;

  const myClasses = state.classes.filter((c) => c.teacherId === user.id);
  const studentIds = Array.from(new Set(myClasses.flatMap((c) => c.studentIds)));
  const pending = myClasses.reduce((n, c) => n + c.pendingStudentIds.length, 0);
  const messages = state.messages.filter((m) => m.fromUserId === user.id || m.toUserId === user.id);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name}`}
        subtitle="Manage classes, lessons, and parent communication."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Classes" value={myClasses.length} />
        <StatCard label="Students" value={studentIds.length} />
        <StatCard label="Pending joins" value={pending} />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href="/teacher/classes" className="rounded-xl border border-border bg-white p-5 hover:border-ember-gold">
          <h2 className="font-display text-xl">Classes</h2>
          <p className="mt-2 text-sm text-muted">Create classes, search and accept students.</p>
        </Link>
        <Link href="/teacher/lessons" className="rounded-xl border border-border bg-white p-5 hover:border-ember-gold">
          <h2 className="font-display text-xl">Lessons</h2>
          <p className="mt-2 text-sm text-muted">Publish your own lessons for a class.</p>
        </Link>
        <Link href="/teacher/messages" className="rounded-xl border border-border bg-white p-5 hover:border-ember-gold">
          <h2 className="font-display text-xl">Parent messages</h2>
          <p className="mt-2 text-sm text-muted">{messages.length} messages in your threads.</p>
        </Link>
      </div>
    </div>
  );
}
