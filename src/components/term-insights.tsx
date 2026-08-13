"use client";

import Link from "next/link";
import {
  bandLabel,
  type TermInsight,
  type TopicBand,
  termStatusLabel,
} from "@/lib/term-insights";

function bandClass(band: TopicBand): string {
  switch (band) {
    case "strong":
      return "bg-teal-50 text-success border-teal-200";
    case "developing":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "weak":
      return "bg-red-50 text-danger border-red-200";
    case "not_started":
      return "bg-surface text-muted border-border";
  }
}

function statusClass(status: TermInsight["status"]): string {
  switch (status) {
    case "strong":
      return "text-success";
    case "on_track":
      return "text-amber-800";
    case "needs_work":
      return "text-danger";
    case "pending":
      return "text-muted";
  }
}

function TopicList({
  title,
  topics,
  empty,
  tone,
}: {
  title: string;
  topics: TermInsight["strengths"];
  empty: string;
  tone: TopicBand;
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h4>
      {topics.length === 0 ? (
        <p className="mt-2 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {topics.map((w) => (
            <li
              key={w.weekId}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${bandClass(tone)}`}
            >
              {w.topic}
              {w.score !== undefined ? ` · ${w.score}%` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TermCard({
  insight,
  showLinks,
}: {
  insight: TermInsight;
  showLinks: boolean;
}) {
  return (
    <article className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Term {insight.termNumber}
          </p>
          <h3 className="mt-0.5 font-display text-xl text-ember-navy">{insight.title}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted">Average</p>
          <p className="font-display text-2xl text-ember-navy">
            {insight.average !== undefined ? `${insight.average}%` : "—"}
          </p>
          <p className={`text-xs font-semibold ${statusClass(insight.status)}`}>
            {termStatusLabel(insight.status)}
          </p>
        </div>
      </div>

      {!insight.hasData ? (
        <p className="mt-4 rounded-md bg-surface px-3 py-2 text-sm text-muted">
          Not enough assessments yet for this term.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <TopicList
            title="Strong"
            topics={insight.strengths}
            empty="No strong topics yet (70%+)."
            tone="strong"
          />
          <TopicList
            title="Weak"
            topics={insight.weaknesses}
            empty="No weak topics — keep it up."
            tone="weak"
          />
          {insight.developing.length > 0 ? (
            <TopicList
              title="Developing"
              topics={insight.developing}
              empty=""
              tone="developing"
            />
          ) : null}

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Where to improve
            </h4>
            {insight.improvements.length === 0 ? (
              <p className="mt-2 text-sm text-muted">
                No specific actions right now. Continue the learn path.
              </p>
            ) : (
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
                {insight.improvements.map((item) => (
                  <li key={item.label}>
                    {showLinks && item.href ? (
                      <Link
                        href={item.href}
                        className="font-medium text-ember-navy underline decoration-ember-gold"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </div>

          <p className="text-xs text-muted">
            Pre-exam:{" "}
            {insight.preExamScore !== undefined
              ? `${insight.preExamScore}%`
              : "not attempted"}
          </p>
        </div>
      )}
    </article>
  );
}

export function TermInsightsPanel({
  insights,
  showLinks = false,
  title = "Strengths and gaps",
  subtitle = "Per-term topic bands from lesson and Saturday tests — and what to practise next.",
  termFilter,
}: {
  insights: TermInsight[];
  /** Student role: link into the learn path. */
  showLinks?: boolean;
  title?: string;
  subtitle?: string;
  /** When set, only render that term (e.g. student term page). */
  termFilter?: string;
}) {
  const list = termFilter
    ? insights.filter((i) => i.termId === termFilter)
    : insights;

  return (
    <section>
      {title ? (
        <div className="mb-3">
          <h2 className="font-semibold text-ember-navy">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">{list.map((insight) => (
        <TermCard key={insight.termId} insight={insight} showLinks={showLinks} />
      ))}</div>
    </section>
  );
}

/** Compact chips for teacher class roster rows. */
export function TermInsightsCompact({ insights }: { insights: TermInsight[] }) {
  const withData = insights.filter((i) => i.hasData);
  if (withData.length === 0) {
    return <p className="text-xs text-muted">No term assessments yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {withData.map((insight) => {
        const strong = insight.strengths.map((w) => w.topic).slice(0, 2);
        const weak = insight.weaknesses.map((w) => w.topic).slice(0, 2);
        const parts: string[] = [];
        if (strong.length) parts.push(`strong: ${strong.join(", ")}`);
        if (weak.length) parts.push(`weak: ${weak.join(", ")}`);
        if (parts.length === 0 && insight.developing.length) {
          parts.push(
            `developing: ${insight.developing
              .map((w) => w.topic)
              .slice(0, 2)
              .join(", ")}`,
          );
        }
        return (
          <span
            key={insight.termId}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-ember-navy"
            title={bandLabel(insight.weeks[0]?.band ?? "not_started")}
          >
            <span className="font-semibold">T{insight.termNumber}</span>
            {insight.average !== undefined ? ` ${insight.average}%` : ""}
            {parts.length ? ` · ${parts.join(" · ")}` : ""}
          </span>
        );
      })}
    </div>
  );
}
