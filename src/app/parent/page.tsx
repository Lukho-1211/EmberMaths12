"use client";

import { PageHeader, StatCard } from "@/components/app-shell";
import { ProgressRing } from "@/components/assessment";
import { useStore } from "@/lib/store";

export default function ParentProgressPage() {
  const { user, state } = useStore();
  if (!user) return null;

  const children = state.users.filter(
    (u) => u.role === "student" && (user.childIds ?? []).includes(u.id),
  );

  return (
    <div>
      <PageHeader
        title="Child progress"
        subtitle="Track lessons, tests, badges, and pass/fail status for your learner."
      />

      {children.length === 0 ? (
        <p className="rounded-xl border border-border bg-white p-5 text-sm text-muted">
          No linked children yet. Demo parent account{" "}
          <code className="rounded bg-ember-gray px-1">parent@ember12.za</code> is linked to Lerato
          Molefe.
        </p>
      ) : (
        <div className="space-y-8">
          {children.map((child) => {
            const progress = state.progress.find((p) => p.studentId === child.id);
            const badges = state.badges.filter((b) => progress?.badgeIds.includes(b.id));
            const scores = Object.entries(progress?.testScores ?? {});

            return (
              <section key={child.id} className="rounded-xl border border-border bg-white p-6">
                <div className="flex flex-wrap items-center gap-6">
                  <ProgressRing value={progress?.overallPercent ?? 0} />
                  <div>
                    <h2 className="font-display text-2xl">{child.name}</h2>
                    <p className="text-sm text-muted">{child.email}</p>
                    <p className="mt-2 text-sm capitalize">
                      Status:{" "}
                      <strong
                        className={
                          progress?.status === "passing"
                            ? "text-success"
                            : progress?.status === "failing"
                              ? "text-danger"
                              : "text-muted"
                        }
                      >
                        {progress?.status ?? "pending"}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <StatCard
                    label="Lessons completed"
                    value={progress?.completedLessonIds.length ?? 0}
                  />
                  <StatCard label="Assessments" value={scores.length} />
                  <StatCard label="Badges" value={badges.length} />
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                      Test scores
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      {scores.length === 0 ? (
                        <li className="text-muted">No tests submitted yet.</li>
                      ) : (
                        scores.map(([id, score]) => (
                          <li
                            key={id}
                            className="flex justify-between rounded-md bg-surface px-3 py-2"
                          >
                            <span className="truncate pr-2">{id}</span>
                            <span className="font-semibold">{score}%</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                      Badges
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm">
                      {badges.length === 0 ? (
                        <li className="text-muted">No badges yet.</li>
                      ) : (
                        badges.map((b) => (
                          <li key={b.id} className="rounded-md bg-surface px-3 py-2">
                            <span className="font-medium">{b.name}</span>
                            <span className="text-muted"> — {b.description}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                    Term overview
                  </h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {state.terms.map((term) => {
                      const weeksDone = term.weeks.filter((w) =>
                        w.lessons.every((l) =>
                          progress?.completedLessonIds.includes(l.id),
                        ),
                      ).length;
                      const pre = progress?.testScores[term.preExam.id];
                      return (
                        <div key={term.id} className="rounded-md border border-border px-3 py-2 text-sm">
                          <p className="font-medium">Term {term.number}</p>
                          <p className="text-muted">
                            {weeksDone}/4 weeks · Pre-exam{" "}
                            {pre !== undefined ? `${pre}%` : "pending"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-xl border border-border bg-ember-navy p-5 text-ember-white">
        <h2 className="font-display text-xl text-ember-gold">Messages from teachers</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {state.messages
            .filter((m) => m.toUserId === user.id)
            .map((m) => {
              const from = state.users.find((u) => u.id === m.fromUserId);
              return (
                <li key={m.id} className="rounded-md bg-white/5 px-3 py-2">
                  <p className="text-xs text-ember-gray">{from?.name}</p>
                  <p>{m.body}</p>
                </li>
              );
            })}
          {state.messages.filter((m) => m.toUserId === user.id).length === 0 ? (
            <li className="text-ember-gray">No messages yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
