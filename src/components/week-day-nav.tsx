import Link from "next/link";
import type { Lesson, WeekDay } from "@/lib/types";

const DAY_ORDER: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

const DAY_LABEL: Record<WeekDay, { short: string; full: string }> = {
  monday: { short: "Mon", full: "Monday" },
  tuesday: { short: "Tue", full: "Tuesday" },
  wednesday: { short: "Wed", full: "Wednesday" },
  thursday: { short: "Thu", full: "Thursday" },
  friday: { short: "Fri", full: "Friday" },
};

export function WeekDayNav({
  termId,
  weekId,
  lessons,
  activeDay,
}: {
  termId: string;
  weekId: string;
  lessons: Lesson[];
  activeDay?: WeekDay;
}) {
  const ordered = DAY_ORDER.map((day) => lessons.find((l) => l.day === day)).filter(
    (l): l is Lesson => Boolean(l),
  );

  if (ordered.length === 0) return null;

  const testWeekActive = activeDay === undefined;

  return (
    <nav
      className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4"
      aria-label="Days and week test"
    >
      {ordered.map((lesson) => {
        const active = lesson.day === activeDay;
        const label = DAY_LABEL[lesson.day];
        return (
          <Link
            key={lesson.id}
            href={`/student/learn/${termId}/${weekId}/${lesson.day}`}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              active
                ? "bg-ember-navy text-white"
                : "border border-border bg-white text-ember-navy hover:border-ember-gold"
            }`}
            aria-label={label.full}
            aria-current={active ? "page" : undefined}
          >
            {label.short}
          </Link>
        );
      })}
      <Link
        href={`/student/learn/${termId}/${weekId}#saturday-test`}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
          testWeekActive
            ? "bg-ember-navy text-white"
            : "border border-ember-gold/50 bg-ember-gold/10 text-ember-navy hover:border-ember-gold"
        }`}
        aria-label="Saturday week test"
        aria-current={testWeekActive ? "page" : undefined}
      >
        Test week
      </Link>
    </nav>
  );
}
