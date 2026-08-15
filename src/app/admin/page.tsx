"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, StatCard } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function AdminDashboardPage() {
  const { state } = useStore();
  const [view, setView] = useState<"students" | "instructors">("students");

  const students = state.users.filter((u) => u.role === "student");
  const teachers = state.users.filter((u) => u.role === "teacher");
  const passing = state.progress.filter((p) => p.status === "passing").length;
  const failing = state.progress.filter((p) => p.status === "failing").length;
  const passRate =
    students.length === 0 ? 0 : Math.round((passing / Math.max(students.length, 1)) * 100);

  const chartData = useMemo(
    () =>
      state.progress.map((p) => {
        const student = state.users.find((u) => u.id === p.studentId);
        return {
          name: student?.name.split(" ")[0] ?? p.studentId,
          progress: p.overallPercent,
        };
      }),
    [state.progress, state.users],
  );

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        subtitle="Overview of Ember Maths12 learners, instructors, and term health."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={students.length} />
        <StatCard label="Teachers" value={teachers.length} />
        <StatCard label="Pass rate" value={`${passRate}%`} hint={`${passing} passing · ${failing} failing`} />
        <StatCard label="Active terms" value={state.terms.length} hint="Term 1–4 seeded" />
      </div>

      <div className="mt-8 flex gap-2">
        <button
          type="button"
          onClick={() => setView("students")}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            view === "students" ? "bg-ember-navy text-white" : "bg-ember-white border border-border"
          }`}
        >
          Students
        </button>
        <button
          type="button"
          onClick={() => setView("instructors")}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${
            view === "instructors" ? "bg-ember-navy text-white" : "bg-ember-white border border-border"
          }`}
        >
          Instructors
        </button>
      </div>

      {view === "students" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-ember-white p-4">
            <h2 className="mb-4 font-semibold">Learner progress</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#FCA311" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-ember-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-ember-navy text-ember-white">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const p = state.progress.find((x) => x.studentId === s.id);
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted">{s.email}</div>
                      </td>
                      <td className="px-4 py-3">{p?.overallPercent ?? 0}%</td>
                      <td className="px-4 py-3 capitalize">{p?.status ?? "pending"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-ember-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ember-navy text-ember-white">
              <tr>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Classes</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.email}</td>
                  <td className="px-4 py-3">
                    {state.classes.filter((c) => c.teacherId === t.id).length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
