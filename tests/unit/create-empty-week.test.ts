import { describe, expect, it } from "vitest";
import {
  createEmptyWeek,
  nextWeekNumber,
  sortWeeksByNumber,
} from "@/lib/curriculum/create-empty-week";

describe("nextWeekNumber", () => {
  it("returns 1 when there are no weeks", () => {
    expect(nextWeekNumber([])).toBe(1);
  });

  it("fills the lowest hole", () => {
    expect(nextWeekNumber([{ number: 1 }, { number: 2 }, { number: 4 }])).toBe(3);
  });

  it("returns the next sequential slot", () => {
    expect(nextWeekNumber([{ number: 1 }, { number: 2 }])).toBe(3);
  });

  it("continues past four when all slots 1–4 are taken", () => {
    expect(
      nextWeekNumber([{ number: 1 }, { number: 2 }, { number: 3 }, { number: 4 }]),
    ).toBe(5);
  });

  it("fills a hole before continuing past four", () => {
    expect(
      nextWeekNumber([
        { number: 1 },
        { number: 2 },
        { number: 4 },
        { number: 5 },
      ]),
    ).toBe(3);
  });

  it("returns max+1 when weeks are contiguous beyond four", () => {
    expect(
      nextWeekNumber([
        { number: 1 },
        { number: 2 },
        { number: 3 },
        { number: 4 },
        { number: 5 },
      ]),
    ).toBe(6);
  });
});

describe("createEmptyWeek", () => {
  it("builds five day lessons without lesson tests and an empty Saturday test", () => {
    const week = createEmptyWeek({
      termNumber: 2,
      weekNumber: 3,
      topic: "Analytical Geometry",
    });

    expect(week.number).toBe(3);
    expect(week.topic).toBe("Analytical Geometry");
    expect(week.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(week.lessons).toHaveLength(5);
    expect(week.lessons.map((l) => l.day)).toEqual([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ]);
    for (const lesson of week.lessons) {
      expect(lesson.lessonTest).toBeUndefined();
      expect(lesson.resources).toEqual([]);
      expect(lesson.videoUrl).toBe("");
      expect(lesson.title).toMatch(/: Untitled$/);
    }
    expect(week.weekTest.questions).toEqual([]);
    expect(week.weekTest.resources).toEqual([]);
    expect(week.weekTest.memoResources).toEqual([]);
    expect(week.weekTest.passMark).toBe(50);
    expect(week.weekTest.title).toContain("Week 3");
    expect(week.weekTest.title).toContain("Analytical Geometry");
  });

  it("supports week numbers beyond 4", () => {
    const week = createEmptyWeek({
      termNumber: 1,
      weekNumber: 5,
      topic: "Extra Revision",
    });
    expect(week.number).toBe(5);
    expect(week.weekTest.title).toContain("Week 5");
  });

  it("falls back to a Week N topic when blank", () => {
    const week = createEmptyWeek({ termNumber: 1, weekNumber: 2, topic: "  " });
    expect(week.topic).toBe("Week 2");
  });
});

describe("sortWeeksByNumber", () => {
  it("orders weeks ascending by number", () => {
    const sorted = sortWeeksByNumber([
      { number: 4 },
      { number: 1 },
      { number: 3 },
      { number: 5 },
    ]);
    expect(sorted.map((w) => w.number)).toEqual([1, 3, 4, 5]);
  });
});
