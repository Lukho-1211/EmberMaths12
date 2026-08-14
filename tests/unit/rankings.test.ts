import { describe, expect, it } from "vitest";
import { findRank, rankStudents } from "@/lib/rankings";
import type { StudentProgress, User } from "@/lib/types";

function student(
  id: string,
  name: string,
  extras: Partial<User> = {},
): User {
  return {
    id,
    name,
    email: `${id}@ember12.za`,
    password: "ember12",
    role: "student",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...extras,
  };
}

function progress(
  studentId: string,
  overallPercent: number,
  status: StudentProgress["status"] = "passing",
): StudentProgress {
  return {
    studentId,
    completedLessonIds: [],
    testScores: {},
    badgeIds: [],
    overallPercent,
    status,
  };
}

describe("rankStudents", () => {
  const users: User[] = [
    student("s1", "Zane", { province: "Gauteng", municipality: "City of Johannesburg" }),
    student("s2", "Amy", { province: "Gauteng", municipality: "City of Tshwane" }),
    student("s3", "Bo", { province: "Western Cape", municipality: "City of Cape Town" }),
    {
      id: "t1",
      name: "Teacher",
      email: "t@ember12.za",
      password: "ember12",
      role: "teacher",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const scores = [
    progress("s1", 90),
    progress("s2", 90),
    progress("s3", 40, "failing"),
  ];

  it("ranks students by overall percent descending", () => {
    const ranked = rankStudents(users, scores, { excludeInactive: false });
    expect(ranked.map((r) => r.user.id)).toEqual(["s2", "s1", "s3"]);
    expect(ranked[0]?.rank).toBe(1);
  });

  it("breaks percent ties by name alphabetically", () => {
    const ranked = rankStudents(users, scores, { excludeInactive: false });
    expect(ranked[0]?.user.name).toBe("Amy");
    expect(ranked[1]?.user.name).toBe("Zane");
  });

  it("filters by province and municipality", () => {
    const byProvince = rankStudents(users, scores, {
      province: "Gauteng",
      excludeInactive: false,
    });
    expect(byProvince.map((r) => r.user.id)).toEqual(["s2", "s1"]);

    const byMuni = rankStudents(users, scores, {
      province: "Gauteng",
      municipality: "City of Johannesburg",
      excludeInactive: false,
    });
    expect(byMuni.map((r) => r.user.id)).toEqual(["s1"]);
  });

  it("limits to studentIds roster", () => {
    const ranked = rankStudents(users, scores, {
      studentIds: ["s3"],
      excludeInactive: false,
    });
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.user.id).toBe("s3");
  });

  it("excludes pending / zero-percent students by default", () => {
    const withPending = [
      ...scores,
      progress("s4", 0, "pending"),
    ];
    const usersWithPending = [
      ...users,
      student("s4", "Pending", { province: "Gauteng", municipality: "City of Johannesburg" }),
    ];
    const ranked = rankStudents(usersWithPending, withPending);
    expect(ranked.every((r) => r.user.id !== "s4")).toBe(true);
  });

  it("applies limit", () => {
    const ranked = rankStudents(users, scores, { excludeInactive: false, limit: 1 });
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.user.name).toBe("Amy");
  });

  it("findRank returns the matching row or null", () => {
    const ranked = rankStudents(users, scores, { excludeInactive: false });
    expect(findRank(ranked, "s2")?.rank).toBe(1);
    expect(findRank(ranked, "missing")).toBeNull();
  });
});
