"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { TermInsightsCompact, TermInsightsPanel } from "@/components/term-insights";
import { buildAllTermInsights } from "@/lib/term-insights";
import { useStore } from "@/lib/store";

export default function TeacherProgressPage() {
  const { user, state } = useStore();
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const myClasses = state.classes.filter((c) => c.teacherId === user?.id);
  const active = myClasses.find((c) => c.id === activeClassId) ?? myClasses[0];

  const roster = useMemo(() => {
    const classes = state.classes.filter((c) => c.teacherId === user?.id);
    const current = classes.find((c) => c.id === activeClassId) ?? classes[0];
    if (!current) return [];
    return current.studentIds.map((id) => {
      const student = state.users.find((u) => u.id === id);
      const progress = state.progress.find((p) => p.studentId === id);
      const insights = buildAllTermInsights(
        state.terms,
        progress,
        state.corrections.filter((c) => c.studentId === id),
      );
      return { student, progress, insights };
    });
  }, [
    activeClassId,
    user?.id,
    state.classes,
    state.users,
    state.progress,
    state.terms,
    state.corrections,
  ]);

  return (
    <div>
      <PageHeader
        title="Student progress"
        subtitle="Per-term strengths, weaknesses, and where each learner should improve."
      />

      {myClasses.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-muted">
          Create a class first, then enrol students to see their term insights.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {myClasses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveClassId(c.id);
                  setExpandedStudentId(null);
                }}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  active?.id === c.id
                    ? "bg-ember-navy text-white"
                    : "border border-border bg-white"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {active ? (
            <div className="space-y-3">
              {roster.length === 0 ? (
                <p className="text-sm text-muted">No enrolled students in this class.</p>
              ) : (
                roster.map(({ student, progress, insights }) => {
                  if (!student) return null;
                  const open = expandedStudentId === student.id;
                  return (
                    <div
                      key={student.id}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedStudentId(open ? null : student.id)
                        }
                        className="flex w-full flex-wrap items-start justify-between gap-3 text-left"
                      >
                        <div>
                          <p className="font-semibold text-ember-navy">{student.name}</p>
                          <p className="text-xs text-muted">
                            Overall {progress?.overallPercent ?? 0}% ·{" "}
                            <span className="capitalize">
                              {progress?.status ?? "pending"}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-ember-navy">
                          {open ? "Hide terms ▲" : "View terms ▼"}
                        </span>
                      </button>
                      <div className="mt-3">
                        <TermInsightsCompact insights={insights} />
                      </div>
                      {open ? (
                        <div className="mt-5 border-t border-border pt-5">
                          <TermInsightsPanel
                            insights={insights}
                            showLinks={false}
                            title={`${student.name} — term report`}
                            subtitle="Strong and weak topics for every term, plus where to improve."
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
