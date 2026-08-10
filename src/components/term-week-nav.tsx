import Link from "next/link";
import type { Week } from "@/lib/types";

export function TermWeekNav({
  termId,
  weeks,
  activeWeekId,
  preExamActive = false,
}: {
  termId: string;
  weeks: Week[];
  activeWeekId?: string;
  preExamActive?: boolean;
}) {
  return (
    <nav
      className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4"
      aria-label="Weeks in this term"
    >
      {weeks.map((w) => {
        const active = !preExamActive && w.id === activeWeekId;
        return (
          <Link
            key={w.id}
            href={`/student/learn/${termId}/${w.id}`}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-ember-navy text-white"
                : "border border-border bg-white text-ember-navy hover:border-ember-gold"
            }`}
            aria-current={active ? "page" : undefined}
          >
            Week {w.number}
          </Link>
        );
      })}
      <Link
        href={`/student/learn/${termId}/pre-exam`}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
          preExamActive
            ? "bg-ember-navy text-white"
            : "border border-ember-gold/50 bg-ember-gold/10 text-ember-navy hover:border-ember-gold"
        }`}
        aria-current={preExamActive ? "page" : undefined}
      >
        Pre-exam
      </Link>
    </nav>
  );
}
