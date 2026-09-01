import type { Lesson, Week, WeekDay, WeekTest } from "@/lib/types";

const DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function dayTitle(day: WeekDay) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

/** Lowest missing positive week number (fill holes first, then max+1). */
export function nextWeekNumber(weeks: Pick<Week, "number">[]): number {
  const used = new Set(weeks.map((w) => w.number));
  let n = 1;
  while (used.has(n)) n += 1;
  return n;
}

function makeEmptyLesson(day: WeekDay): Lesson {
  return {
    id: crypto.randomUUID(),
    day,
    title: `${dayTitle(day)}: Untitled`,
    description: "",
    videoUrl: "",
    durationMinutes: 25,
    resources: [],
  };
}

function makeEmptyWeekTest(weekNumber: number, topic: string): WeekTest {
  return {
    id: crypto.randomUUID(),
    title: `Week ${weekNumber} Saturday Test — ${topic}`,
    description: `Assess Week ${weekNumber} understanding of ${topic}. Choose on-screen MCQ or Paper + scan.`,
    questions: [],
    passMark: 50,
    resources: [],
    memoResources: [],
  };
}

/** Empty Mon–Fri lesson shells + Saturday week test for admin-created weeks. */
export function createEmptyWeek(input: {
  termNumber: number;
  weekNumber: number;
  topic: string;
}): Week {
  void input.termNumber;
  const topic = input.topic.trim() || `Week ${input.weekNumber}`;
  return {
    id: crypto.randomUUID(),
    number: input.weekNumber,
    topic,
    lessons: DAYS.map((day) => makeEmptyLesson(day)),
    weekTest: makeEmptyWeekTest(input.weekNumber, topic),
  };
}

export function sortWeeksByNumber<T extends Pick<Week, "number">>(weeks: T[]): T[] {
  return [...weeks].sort((a, b) => a.number - b.number);
}
