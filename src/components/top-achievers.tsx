"use client";

import type { RankedStudent } from "@/lib/rankings";

export function TopAchieversBoard({
  rows,
  highlightUserId,
  emptyMessage = "No ranked students yet.",
  showLocation = true,
}: {
  rows: RankedStudent[];
  highlightUserId?: string;
  emptyMessage?: string;
  showLocation?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-ember-navy text-white">
          <tr>
            <th className="px-4 py-3 w-16">Rank</th>
            <th className="px-4 py-3">Student</th>
            {showLocation ? (
              <>
                <th className="hidden px-4 py-3 sm:table-cell">Province</th>
                <th className="hidden px-4 py-3 md:table-cell">Municipality</th>
              </>
            ) : null}
            <th className="px-4 py-3">Progress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const highlight = highlightUserId === r.user.id;
            return (
              <tr
                key={r.user.id}
                className={`border-t border-border ${
                  highlight ? "bg-ember-gold/15" : ""
                }`}
              >
                <td className="px-4 py-3 font-display text-lg text-ember-navy">{r.rank}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {r.user.name}
                    {highlight ? (
                      <span className="ml-2 rounded-full bg-ember-gold/40 px-2 py-0.5 text-xs font-semibold text-ember-navy">
                        You
                      </span>
                    ) : null}
                  </div>
                  {showLocation ? (
                    <div className="text-xs text-muted sm:hidden">
                      {[r.user.municipality, r.user.province].filter(Boolean).join(" · ")}
                    </div>
                  ) : null}
                </td>
                {showLocation ? (
                  <>
                    <td className="hidden px-4 py-3 sm:table-cell">{r.user.province ?? "—"}</td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {r.user.municipality ?? "—"}
                    </td>
                  </>
                ) : null}
                <td className="px-4 py-3">
                  <span className="font-semibold">{r.overallPercent}%</span>
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RankSummaryCard({
  title,
  entry,
  total,
}: {
  title: string;
  entry: RankedStudent | null;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</p>
      {entry ? (
        <>
          <p className="mt-2 font-display text-3xl text-ember-navy">#{entry.rank}</p>
          <p className="mt-1 text-sm text-muted">
            of {total} · {entry.overallPercent}% overall
          </p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">
          Complete lessons or tests to appear on this board.
        </p>
      )}
    </div>
  );
}
