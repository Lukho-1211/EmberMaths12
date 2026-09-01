import { createClient } from "@/lib/supabase/client";
import { SEED_BADGES } from "@/lib/mock/seed";
import { SEED_TERMS } from "@/lib/mock/curriculum";
import type {
  AppState,
  Badge,
  CorrectionResult,
  Lesson,
  Message,
  QuestionFeedback,
  Role,
  SchoolClass,
  StudentProgress,
  StudyGroup,
  Term,
  User,
} from "@/lib/types";

export type ProfileDbRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  province: string | null;
  municipality: string | null;
  parent_id: string | null;
  theme: string | null;
  created_at: string;
};

function profileToUser(profile: ProfileDbRow, classIds: string[] = []): User {
  const childIds =
    profile.role === "parent"
      ? undefined // filled after all profiles loaded
      : undefined;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    password: "",
    role: profile.role,
    parentId: profile.parent_id ?? undefined,
    childIds,
    classIds:
      profile.role === "student" || profile.role === "teacher" ? classIds : undefined,
    province: profile.province ?? undefined,
    municipality: profile.municipality ?? undefined,
    createdAt: profile.created_at,
  };
}

function emptyAppState(): AppState {
  return {
    users: [],
    terms: structuredClone(SEED_TERMS),
    progress: [],
    badges: structuredClone(SEED_BADGES),
    groups: [],
    classes: [],
    messages: [],
    corrections: [],
    teacherLessons: [],
  };
}

export async function loadAppState(): Promise<{
  state: AppState;
  theme: "light" | "dark";
  userId: string | null;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { state: emptyAppState(), theme: "light", userId: null };
  }

  const [
    profilesRes,
    curriculumApi,
    progressRes,
    classesRes,
    membersRes,
    groupsRes,
    groupMembersRes,
    messagesRes,
    correctionsRes,
    teacherLessonsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, email, role, province, municipality, parent_id, theme, created_at"),
    // Curriculum (with answer keys for admins only) comes from the API — not direct table SELECT.
    fetch("/api/curriculum", { credentials: "same-origin" }).then(async (res) => {
      if (!res.ok) return null;
      return (await res.json()) as {
        ok?: boolean;
        terms?: Term[];
        badges?: Badge[];
      };
    }).catch(() => null),
    supabase
      .from("student_progress")
      .select(
        "student_id, completed_lesson_ids, test_scores, badge_ids, overall_percent, status",
      ),
    supabase.from("school_classes").select("id, name, teacher_id, created_at"),
    supabase.from("class_members").select("class_id, student_id, status"),
    supabase.from("study_groups").select("id, name, description, term_id, created_at"),
    supabase.from("study_group_members").select("group_id, student_id"),
    supabase
      .from("messages")
      .select("id, from_user_id, to_user_id, student_id, body, read, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("corrections")
      .select(
        "id, student_id, file_name, score, feedback, summary, assessment_id, assessment_title, mode, question_feedback, created_at",
      )
      .order("created_at", { ascending: false }),
    supabase.from("teacher_lessons").select("id, created_by, class_id, payload, created_at"),
  ]);

  const profiles = (profilesRes.data ?? []) as ProfileDbRow[];
  // #region agent log
  fetch('http://127.0.0.1:7314/ingest/544156a0-1eaf-4d8c-a641-963e0cde3691',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7039'},body:JSON.stringify({sessionId:'3e7039',runId:'pre-fix',hypothesisId:'B',location:'app-state.ts:loadAppState',message:'loadAppState query results',data:{profileCount:profiles.length,profilesError:profilesRes.error?.message ?? null,progressError:progressRes.error?.message ?? null,curriculumOk:Boolean(curriculumApi?.ok),termCount:curriculumApi?.terms?.length ?? 0,authUserId:user.id},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const classRows = classesRes.data ?? [];
  const memberRows = membersRes.data ?? [];

  const classIdsByUser = new Map<string, string[]>();
  for (const c of classRows) {
    const list = classIdsByUser.get(c.teacher_id) ?? [];
    list.push(c.id);
    classIdsByUser.set(c.teacher_id, list);
  }
  for (const m of memberRows) {
    if (m.status !== "enrolled") continue;
    const list = classIdsByUser.get(m.student_id) ?? [];
    list.push(m.class_id);
    classIdsByUser.set(m.student_id, list);
  }

  let users: User[] = profiles.map((p) =>
    profileToUser(p, classIdsByUser.get(p.id) ?? []),
  );

  // Fill parent childIds from profiles.parent_id
  users = users.map((u) => {
    if (u.role !== "parent") return u;
    return {
      ...u,
      childIds: users.filter((c) => c.parentId === u.id).map((c) => c.id),
    };
  });

  const ownProfile = profiles.find((p) => p.id === user.id);
  const theme: "light" | "dark" =
    ownProfile?.theme === "dark" ? "dark" : "light";

  const terms =
    curriculumApi?.terms &&
    Array.isArray(curriculumApi.terms) &&
    curriculumApi.terms.length > 0
      ? curriculumApi.terms
      : structuredClone(SEED_TERMS);
  const badges =
    curriculumApi?.badges &&
    Array.isArray(curriculumApi.badges) &&
    curriculumApi.badges.length > 0
      ? curriculumApi.badges
      : structuredClone(SEED_BADGES);

  const progress: StudentProgress[] = (progressRes.data ?? []).map((p) => ({
    studentId: p.student_id,
    completedLessonIds: p.completed_lesson_ids ?? [],
    testScores: (p.test_scores ?? {}) as Record<string, number>,
    badgeIds: p.badge_ids ?? [],
    overallPercent: p.overall_percent ?? 0,
    status: (p.status as StudentProgress["status"]) ?? "pending",
  }));

  const classes: SchoolClass[] = classRows.map((c) => ({
    id: c.id,
    name: c.name,
    teacherId: c.teacher_id,
    studentIds: memberRows
      .filter((m) => m.class_id === c.id && m.status === "enrolled")
      .map((m) => m.student_id),
    pendingStudentIds: memberRows
      .filter((m) => m.class_id === c.id && m.status === "pending")
      .map((m) => m.student_id),
    createdAt: c.created_at,
  }));

  const groupRows = groupsRes.data ?? [];
  const groupMemberRows = groupMembersRes.data ?? [];
  const groups: StudyGroup[] = groupRows.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description ?? "",
    termId: g.term_id ?? undefined,
    memberIds: groupMemberRows
      .filter((m) => m.group_id === g.id)
      .map((m) => m.student_id),
    createdAt: g.created_at,
  }));

  const messages: Message[] = (messagesRes.data ?? []).map((m) => ({
    id: m.id,
    fromUserId: m.from_user_id,
    toUserId: m.to_user_id,
    studentId: m.student_id ?? undefined,
    body: m.body,
    createdAt: m.created_at,
    read: Boolean(m.read),
  }));

  const corrections: CorrectionResult[] = (correctionsRes.data ?? []).map((c) => ({
    id: c.id,
    studentId: c.student_id,
    fileName: c.file_name,
    score: c.score,
    feedback: (c.feedback as string[]) ?? [],
    summary: c.summary ?? "",
    createdAt: c.created_at,
    assessmentId: c.assessment_id ?? undefined,
    assessmentTitle: c.assessment_title ?? undefined,
    mode: (c.mode as CorrectionResult["mode"]) ?? undefined,
    questionFeedback: (c.question_feedback as QuestionFeedback[] | null) ?? undefined,
  }));

  const teacherLessons: Lesson[] = (teacherLessonsRes.data ?? []).map((row) => {
    const payload = row.payload as Lesson;
    return {
      ...payload,
      id: row.id,
      createdByTeacherId: row.created_by,
      classId: row.class_id ?? payload.classId,
    };
  });

  return {
    state: {
      users,
      terms,
      progress,
      badges,
      groups,
      classes,
      messages,
      corrections,
      teacherLessons,
    },
    theme,
    userId: user.id,
  };
}

export async function saveCurriculum(terms: Term[], badges: Badge[]) {
  const supabase = createClient();
  const { error } = await supabase.from("curriculum").upsert({
    id: "default",
    terms,
    badges,
    updated_at: new Date().toISOString(),
  });
  // #region agent log
  fetch('http://127.0.0.1:7314/ingest/544156a0-1eaf-4d8c-a641-963e0cde3691',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'3e7039'},body:JSON.stringify({sessionId:'3e7039',runId:'pre-fix',hypothesisId:'D',location:'app-state.ts:saveCurriculum',message:'saveCurriculum result',data:{ok:!error,error:error?.message ?? null,termCount:terms.length,weekCounts:terms.map((t)=>({id:t.id,weeks:t.weeks.length}))},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (error) console.error("saveCurriculum", error);
}

export async function saveProgress(progress: StudentProgress) {
  const supabase = createClient();
  const { error } = await supabase.from("student_progress").upsert({
    student_id: progress.studentId,
    completed_lesson_ids: progress.completedLessonIds,
    test_scores: progress.testScores,
    badge_ids: progress.badgeIds,
    overall_percent: progress.overallPercent,
    status: progress.status,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("saveProgress", error);
}

export async function deleteProgress(studentId: string) {
  const supabase = createClient();
  await supabase.from("student_progress").delete().eq("student_id", studentId);
}

export async function saveTheme(userId: string, theme: "light" | "dark") {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ theme }).eq("id", userId);
  if (error) console.error("saveTheme", error);
}

export async function updateProfileRow(
  userId: string,
  input: {
    name: string;
    email: string;
    password?: string;
    province?: string;
    municipality?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();

  const authUpdate: { email?: string; password?: string; data?: Record<string, string> } = {
    data: { name: input.name },
  };
  if (input.email) authUpdate.email = input.email.trim().toLowerCase();
  if (input.password && input.password.trim().length > 0) {
    authUpdate.password = input.password.trim();
  }

  const { error: authError } = await supabase.auth.updateUser(authUpdate);
  if (authError) {
    return { ok: false, error: authError.message };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      province: input.province ?? null,
      municipality: input.municipality ?? null,
    })
    .eq("id", userId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function insertStudyGroup(group: StudyGroup) {
  const supabase = createClient();
  const { error } = await supabase.from("study_groups").insert({
    id: group.id,
    name: group.name,
    description: group.description,
    term_id: group.termId ?? null,
    created_at: group.createdAt,
  });
  if (error) console.error("insertStudyGroup", error);
}

export async function deleteStudyGroup(groupId: string) {
  const supabase = createClient();
  await supabase.from("study_group_members").delete().eq("group_id", groupId);
  await supabase.from("study_groups").delete().eq("id", groupId);
}

export async function addGroupMember(groupId: string, studentId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("study_group_members").upsert({
    group_id: groupId,
    student_id: studentId,
  });
  if (error) console.error("addGroupMember", error);
}

export async function removeGroupMember(groupId: string, studentId: string) {
  const supabase = createClient();
  await supabase
    .from("study_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("student_id", studentId);
}

export async function insertSchoolClass(schoolClass: SchoolClass) {
  const supabase = createClient();
  const { error } = await supabase.from("school_classes").insert({
    id: schoolClass.id,
    name: schoolClass.name,
    teacher_id: schoolClass.teacherId,
    created_at: schoolClass.createdAt,
  });
  if (error) console.error("insertSchoolClass", error);
}

export async function upsertClassMember(
  classId: string,
  studentId: string,
  status: "enrolled" | "pending",
) {
  const supabase = createClient();
  const { error } = await supabase.from("class_members").upsert({
    class_id: classId,
    student_id: studentId,
    status,
  });
  if (error) console.error("upsertClassMember", error);
}

export async function insertMessage(message: Message) {
  const supabase = createClient();
  const { error } = await supabase.from("messages").insert({
    id: message.id,
    from_user_id: message.fromUserId,
    to_user_id: message.toUserId,
    student_id: message.studentId ?? null,
    body: message.body,
    read: message.read,
    created_at: message.createdAt,
  });
  if (error) console.error("insertMessage", error);
}

export async function markMessageReadDb(messageId: string) {
  const supabase = createClient();
  await supabase.from("messages").update({ read: true }).eq("id", messageId);
}

export async function insertCorrection(correction: CorrectionResult) {
  const supabase = createClient();
  const { error } = await supabase.from("corrections").insert({
    id: correction.id,
    student_id: correction.studentId,
    file_name: correction.fileName,
    score: correction.score,
    feedback: correction.feedback,
    summary: correction.summary,
    assessment_id: correction.assessmentId ?? null,
    assessment_title: correction.assessmentTitle ?? null,
    mode: correction.mode ?? null,
    question_feedback: correction.questionFeedback ?? null,
    created_at: correction.createdAt,
  });
  if (error) console.error("insertCorrection", error);
}

export async function insertTeacherLesson(lesson: Lesson) {
  const supabase = createClient();
  const createdBy = lesson.createdByTeacherId;
  if (!createdBy) {
    console.error("insertTeacherLesson: missing createdByTeacherId");
    return;
  }
  const { error } = await supabase.from("teacher_lessons").insert({
    id: lesson.id,
    created_by: createdBy,
    class_id: lesson.classId ?? null,
    payload: lesson,
  });
  if (error) console.error("insertTeacherLesson", error);
}

export async function uploadLessonFile(
  file: File,
  pathPrefix = "uploads",
): Promise<{ url: string; path: string } | { error: string }> {
  const supabase = createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${pathPrefix}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("lesson-files").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from("lesson-files").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
