"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function AdminPassFailPage() {
  const { state } = useStore();
  const [filter, setFilter] = useState<"all" | "passing" | "failing" | "pending">("all");

  const rows = useMemo(() => {
    return state.users
      .filter((u) => u.role === "student")
      .map((s) => {
        const p = state.progress.find((x) => x.studentId === s.id);
        return {
          student: s,
          progress: p?.overallPercent ?? 0,
          status: p?.status ?? "pending",
          lessons: p?.completedLessonIds.length ?? 0,
        };
      })
      .filter((r) => filter === "all" || r.status === filter);
  }, [state, filter]);

  return (
    <div>
      <PageHeader
        title="Passing & failing students"
        subtitle="Monitor who is on track across Ember Maths12 assessments."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "passing", "failing", "pending"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${
              filter === f ? "bg-ember-navy text-white" : "border border-border bg-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-ember-navy text-white">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Lessons done</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.student.name}</div>
                  <div className="text-xs text-muted">{r.student.email}</div>
                </td>
                <td className="px-4 py-3">{r.lessons}</td>
                <td className="px-4 py-3">{r.progress}%</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      r.status === "passing"
                        ? "bg-teal-100 text-success"
                        : r.status === "failing"
                          ? "bg-red-100 text-danger"
                          : "bg-ember-gray text-muted"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
