import type { StudentProgress, User } from "@/lib/types";

export interface RankedStudent {
  rank: number;
  user: User;
  overallPercent: number;
  status: StudentProgress["status"];
}

export interface RankFilters {
  province?: string;
  municipality?: string;
  /** Limit to these student ids (e.g. teacher's class roster) */
  studentIds?: string[];
  /** When true (default), exclude pending / 0% students from the board */
  excludeInactive?: boolean;
  limit?: number;
}

export function rankStudents(
  users: User[],
  progress: StudentProgress[],
  filters: RankFilters = {},
): RankedStudent[] {
  const {
    province,
    municipality,
    studentIds,
    excludeInactive = true,
    limit,
  } = filters;

  const idSet = studentIds ? new Set(studentIds) : null;
  const progressById = new Map(progress.map((p) => [p.studentId, p]));

  let rows = users
    .filter((u) => u.role === "student")
    .filter((u) => (idSet ? idSet.has(u.id) : true))
    .filter((u) => (province ? u.province === province : true))
    .filter((u) => (municipality ? u.municipality === municipality : true))
    .map((user) => {
      const p = progressById.get(user.id);
      return {
        user,
        overallPercent: p?.overallPercent ?? 0,
        status: p?.status ?? ("pending" as const),
      };
    });

  if (excludeInactive) {
    rows = rows.filter((r) => r.status !== "pending" && r.overallPercent > 0);
  }

  rows.sort((a, b) => {
    if (b.overallPercent !== a.overallPercent) return b.overallPercent - a.overallPercent;
    return a.user.name.localeCompare(b.user.name);
  });

  const ranked: RankedStudent[] = rows.map((r, i) => ({
    rank: i + 1,
    user: r.user,
    overallPercent: r.overallPercent,
    status: r.status,
  }));

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

/** Find a student's rank within a ranked list, or null if not present. */
export function findRank(ranked: RankedStudent[], studentId: string): RankedStudent | null {
  return ranked.find((r) => r.user.id === studentId) ?? null;
}
