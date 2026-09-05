"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function TeacherMessagesPage() {
  const { user, state, sendMessage, markMessageRead } = useStore();

  const parentOptions = useMemo(() => {
    const myClasses = state.classes.filter((c) => c.teacherId === user?.id);
    const studentIds = Array.from(new Set(myClasses.flatMap((c) => c.studentIds)));
    return studentIds
      .map((sid) => {
        const student = state.users.find((u) => u.id === sid);
        const parent = state.users.find((u) => u.id === student?.parentId);
        if (!student || !parent) return null;
        return { student, parent };
      })
      .filter(Boolean) as {
      student: { id: string; name: string };
      parent: { id: string; name: string; email: string };
    }[];
  }, [user?.id, state.classes, state.users]);

  const [toUserId, setToUserId] = useState(parentOptions[0]?.parent.id ?? "");
  const [studentId, setStudentId] = useState(parentOptions[0]?.student.id ?? "");
  const [body, setBody] = useState("");

  const thread = state.messages.filter(
    (m) =>
      user &&
      ((m.fromUserId === user.id && m.toUserId === toUserId) ||
        (m.toUserId === user.id && m.fromUserId === toUserId)),
  );

  const unreadKey = thread
    .filter((m) => !m.read && m.toUserId === user?.id)
    .map((m) => m.id)
    .join(",");

  useEffect(() => {
    if (!user || !unreadKey) return;
    for (const id of unreadKey.split(",")) markMessageRead(id);
  }, [unreadKey, user, markMessageRead]);

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!user || !toUserId || !body.trim()) return;
    sendMessage({ fromUserId: user.id, toUserId, studentId, body: body.trim() });
    setBody("");
  }

  return (
    <div>
      <PageHeader
        title="Parent messages"
        subtitle="View parent info for your students and send updates."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {parentOptions.map(({ student, parent }) => (
          <button
            key={student.id}
            type="button"
            onClick={() => {
              setToUserId(parent.id);
              setStudentId(student.id);
            }}
            className={`rounded-xl border p-4 text-left ${
              toUserId === parent.id ? "border-ember-gold bg-white" : "border-border bg-white"
            }`}
          >
            <p className="font-medium">{student.name}</p>
            <p className="text-sm text-muted">
              Parent: {parent.name} · {parent.email}
            </p>
          </button>
        ))}
        {parentOptions.length === 0 ? (
          <p className="text-sm text-muted">No linked parents in your classes yet.</p>
        ) : null}
      </div>

      {toUserId ? (
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="mb-4 max-h-72 space-y-3 overflow-y-auto">
            {thread.length === 0 ? (
              <p className="text-sm text-muted">No messages yet.</p>
            ) : (
              thread.map((m) => {
                const mine = m.fromUserId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`rounded-md px-3 py-2 text-sm ${
                      mine ? "ml-8 bg-ember-navy text-white" : "mr-8 bg-surface"
                    }`}
                  >
                    {m.body}
                    <p className={`mt-1 text-[10px] ${mine ? "text-ember-gray" : "text-muted"}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={onSend} className="flex gap-2">
            <input
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
              placeholder="Write a message to the parent…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
