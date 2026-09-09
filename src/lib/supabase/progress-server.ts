import { createEmptyTerms } from "@/lib/curriculum/empty-terms";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { emptyStudentProgress, recomputeProgress } from "@/lib/domain";
import { SEED_BADGES } from "@/lib/mock/seed";
import type { Badge, CorrectionResult, Role, StudentProgress, Term } from "@/lib/types";

type ProgressDbRow = {
  student_id: string;
  completed_lesson_ids: string[] | null;
  test_scores: Record<string, number> | null;
  badge_ids: string[] | null;
  overall_percent: number | null;
  status: StudentProgress["status"] | null;
};

type CurriculumRow = {
  terms: Term[] | unknown;
  badges: Badge[] | unknown;
};

function parseCurriculum(row: CurriculumRow | null | undefined): {
  terms: Term[];
  badges: Badge[];
} {
  const terms =
    row?.terms && Array.isArray(row.terms) && row.terms.length > 0
      ? (row.terms as Term[])
      : createEmptyTerms();
  const badges =
    row?.badges && Array.isArray(row.badges) && row.badges.length > 0
      ? (row.badges as Badge[])
      : structuredClone(SEED_BADGES);
  return { terms, badges };
}

/**
 * Load full curriculum (with answer keys) for API scoring / admin GET.
 *
 * Order:
 * 1. Service-role table/RPC read (preferred when SUPABASE_SERVICE_ROLE_KEY is real)
 * 2. Admin cookie session SELECT (RLS allows is_admin())
 * 3. Empty Term 1–4 shells (no placeholder lessons)
 */
export async function loadCurriculumServer(opts?: {
  role?: Role;
}): Promise<{ terms: Term[]; badges: Badge[] }> {
  try {
    const admin = createAdminClient();
    const { data: rpcData, error: rpcError } = await admin.rpc("get_curriculum_row");
    if (!rpcError) {
      const row = Array.isArray(rpcData)
        ? (rpcData[0] as CurriculumRow | undefined)
        : (rpcData as CurriculumRow | null);
      if (row?.terms && Array.isArray(row.terms) && row.terms.length > 0) {
        return parseCurriculum(row);
      }
    }

    const { data: tableRow } = await admin
      .from("curriculum")
      .select("terms, badges")
      .eq("id", "default")
      .maybeSingle();
    if (tableRow?.terms && Array.isArray(tableRow.terms) && tableRow.terms.length > 0) {
      return parseCurriculum(tableRow as CurriculumRow);
    }
  } catch (err) {
    console.error("loadCurriculumServer admin path failed", err);
  }

  if (opts?.role === "admin") {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("curriculum")
        .select("terms, badges")
        .eq("id", "default")
        .maybeSingle();
      if (data?.terms && Array.isArray(data.terms) && data.terms.length > 0) {
        return parseCurriculum(data as CurriculumRow);
      }
    } catch (err) {
      console.error("loadCurriculumServer admin cookie path failed", err);
    }
  }

  return {
    terms: createEmptyTerms(),
    badges: structuredClone(SEED_BADGES),
  };
}

export async function loadProgressServer(
  studentId: string,
): Promise<StudentProgress> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_progress")
    .select(
      "student_id, completed_lesson_ids, test_scores, badge_ids, overall_percent, status",
    )
    .eq("student_id", studentId)
    .maybeSingle();

  if (!data) return emptyStudentProgress(studentId);
  return rowToProgress(data as ProgressDbRow);
}

export async function upsertProgressServer(
  progress: StudentProgress,
): Promise<StudentProgress> {
  const next = recomputeProgress(progress);
  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_student_progress", {
    p_student_id: next.studentId,
    p_completed_lesson_ids: next.completedLessonIds,
    p_test_scores: next.testScores,
    p_badge_ids: next.badgeIds,
    p_overall_percent: next.overallPercent,
    p_status: next.status,
  });
  if (error) throw new Error(error.message);
  return next;
}

export async function insertCorrectionServer(
  correction: CorrectionResult,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("insert_correction_row", {
    p_id: correction.id,
    p_student_id: correction.studentId,
    p_file_name: correction.fileName,
    p_score: correction.score,
    p_feedback: correction.feedback,
    p_summary: correction.summary,
    p_assessment_id: correction.assessmentId ?? null,
    p_assessment_title: correction.assessmentTitle ?? null,
    p_mode: correction.mode ?? null,
    p_question_feedback: correction.questionFeedback ?? null,
    p_created_at: correction.createdAt,
  });
  if (error) throw new Error(error.message);
}

function rowToProgress(row: ProgressDbRow): StudentProgress {
  return {
    studentId: row.student_id,
    completedLessonIds: row.completed_lesson_ids ?? [],
    testScores: (row.test_scores ?? {}) as Record<string, number>,
    badgeIds: row.badge_ids ?? [],
    overallPercent: row.overall_percent ?? 0,
    status: row.status ?? "pending",
  };
}
