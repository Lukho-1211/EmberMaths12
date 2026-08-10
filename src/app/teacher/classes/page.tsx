"use client";

import { FormEvent, useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function TeacherClassesPage() {
  const {
    user,
    state,
    createClass,
    searchStudents,
    acceptStudent,
    addStudentToClass,
  } = useStore();
  const [className, setClassName] = useState("");
  const [query, setQuery] = useState("");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  const myClasses = state.classes.filter((c) => c.teacherId === user?.id);
  const active = myClasses.find((c) => c.id === activeClassId) ?? myClasses[0];
  const results = useMemo(() => (query ? searchStudents(query) : []), [query, searchStudents]);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!user || !className.trim()) return;
    createClass(user.id, className.trim());
    setClassName("");
  }

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Create a class, accept pending learners, or search to add students."
      />

      <form onSubmit={onCreate} className="mb-6 flex flex-wrap gap-2">
        <input
          className="min-w-[220px] flex-1 rounded-md border border-border px-3 py-2 text-sm"
          placeholder="New class name"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          required
        />
        <button type="submit" className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy">
          Create class
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {myClasses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveClassId(c.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              active?.id === c.id ? "bg-ember-navy text-white" : "border border-border bg-white"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {active ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-semibold">{active.name}</h2>
            <p className="mt-1 text-xs text-muted">
              {active.studentIds.length} students · {active.pendingStudentIds.length} pending
            </p>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
              Enrolled
            </h3>
            <ul className="mt-2 space-y-2">
              {active.studentIds.map((id) => {
                const s = state.users.find((u) => u.id === id);
                const parent = state.users.find((u) => u.id === s?.parentId);
                return (
                  <li key={id} className="rounded-md bg-surface px-3 py-2 text-sm">
                    <p className="font-medium">{s?.name}</p>
                    <p className="text-xs text-muted">
                      Parent: {parent ? `${parent.name} (${parent.email})` : "Not linked"}
                    </p>
                  </li>
                );
              })}
            </ul>

            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">
              Pending requests
            </h3>
            <ul className="mt-2 space-y-2">
              {active.pendingStudentIds.length === 0 ? (
                <li className="text-sm text-muted">No pending students.</li>
              ) : (
                active.pendingStudentIds.map((id) => {
                  const s = state.users.find((u) => u.id === id);
                  return (
                    <li key={id} className="flex items-center justify-between text-sm">
                      <span>{s?.name}</span>
                      <button
                        type="button"
                        onClick={() => acceptStudent(active.id, id)}
                        className="rounded-md bg-ember-navy px-3 py-1 text-xs text-white"
                      >
                        Accept
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-semibold">Search students</h2>
            <input
              className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
              placeholder="Name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <ul className="mt-4 space-y-2">
              {results.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <span>
                    {s.name}
                    <span className="block text-xs text-muted">{s.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addStudentToClass(active.id, s.id)}
                    className="rounded-md border border-border px-3 py-1 text-xs hover:border-ember-gold"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Create a class to get started.</p>
      )}
    </div>
  );
}
