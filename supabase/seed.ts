import { createClient } from "@supabase/supabase-js";
import { createEmptyTerms } from "../src/lib/curriculum/empty-terms";
import { DEMO_DB_USERS, DEMO_PASSWORD, DEMO_SCHOOL_NAME } from "../src/lib/demo-accounts";
import { SEED_BADGES, SEED_PROGRESS, SEED_USERS } from "../src/lib/mock/seed";
import type { Role } from "../src/lib/types";

/** Extra demo accounts (beyond core DEMO_DB_USERS) so rankings / classes have Auth UUIDs. */
const EXTRA_DEMO_USERS: {
  name: string;
  email: string;
  role: Role;
  province?: string;
  municipality?: string;
  grade?: string;
  schoolName?: string;
  parentEmail?: string;
  createdAt: string;
}[] = SEED_USERS.filter(
  (u) => !DEMO_DB_USERS.some((d) => d.email.toLowerCase() === u.email.toLowerCase()),
).map((u) => ({
  name: u.name,
  email: u.email,
  role: u.role,
  province: u.province,
  municipality: u.municipality,
  grade: u.role === "student" ? "12" : undefined,
  schoolName: u.role === "student" || u.role === "teacher" ? DEMO_SCHOOL_NAME : undefined,
  parentEmail:
    u.role === "student" && u.parentId
      ? SEED_USERS.find((p) => p.id === u.parentId)?.email
      : undefined,
  createdAt: u.createdAt,
}));

const ALL_DEMO = [
  ...DEMO_DB_USERS.map((d) => ({
    name: d.name,
    email: d.email,
    role: d.role,
    province: d.province,
    municipality: d.municipality,
    grade: d.grade,
    schoolName: d.schoolName,
    phone: d.phone,
    parentEmail: d.parentEmail,
    createdAt: d.createdAt,
  })),
  ...EXTRA_DEMO_USERS,
];

/** Map legacy mock ids → emails for progress / class / group seeding. */
const LEGACY_EMAIL: Record<string, string> = Object.fromEntries(
  SEED_USERS.map((u) => [u.id, u.email.toLowerCase()]),
);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed.",
    );
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) throw listError;

  const byEmail = new Map(
    listed.users
      .filter((u) => u.email)
      .map((u) => [u.email!.toLowerCase(), u] as const),
  );

  for (const demo of ALL_DEMO) {
    const email = demo.email.toLowerCase();
    const metadata = {
      name: demo.name,
      role: demo.role,
      province: demo.province ?? null,
      municipality: demo.municipality ?? null,
      grade: demo.grade ?? null,
      school_name: demo.schoolName ?? null,
      phone: "phone" in demo ? (demo.phone ?? null) : null,
    };

    const existing = byEmail.get(email);

    if (existing) {
      const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (updateError) throw updateError;

      const { error: profileError } = await admin.from("profiles").upsert({
        id: existing.id,
        name: demo.name,
        email,
        role: demo.role,
        province: demo.province ?? null,
        municipality: demo.municipality ?? null,
        grade: demo.grade ?? null,
        school_name: demo.schoolName ?? null,
        phone: "phone" in demo ? (demo.phone ?? null) : null,
        theme: "light",
      });
      if (profileError) throw profileError;
      console.log(`Updated ${email}`);
      continue;
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (createError || !created.user) throw createError ?? new Error(`Failed to create ${email}`);

    const { error: profileError } = await admin.from("profiles").upsert({
      id: created.user.id,
      name: demo.name,
      email,
      role: demo.role,
      province: demo.province ?? null,
      municipality: demo.municipality ?? null,
      grade: demo.grade ?? null,
      school_name: demo.schoolName ?? null,
      phone: "phone" in demo ? (demo.phone ?? null) : null,
      theme: "light",
      created_at: demo.createdAt,
    });
    if (profileError) throw profileError;
    console.log(`Created ${email}`);
  }

  const { data: profiles, error: listProfilesError } = await admin
    .from("profiles")
    .select("id, email");
  if (listProfilesError) throw listProfilesError;

  const idByEmail = new Map(
    (profiles ?? [])
      .filter((p) => p.email)
      .map((p) => [String(p.email).toLowerCase(), p.id as string] as const),
  );

  for (const demo of ALL_DEMO) {
    if (!demo.parentEmail) continue;
    const studentId = idByEmail.get(demo.email.toLowerCase());
    const parentId = idByEmail.get(demo.parentEmail.toLowerCase());
    if (!studentId || !parentId) continue;
    const { error } = await admin.from("profiles").update({ parent_id: parentId }).eq("id", studentId);
    if (error) throw error;
    console.log(`Linked ${demo.email} → parent ${demo.parentEmail}`);
  }

  for (const demo of ALL_DEMO.filter((u) => u.role === "student")) {
    const profileId = idByEmail.get(demo.email.toLowerCase());
    const { error } = await admin.from("student").upsert(
      {
        name: demo.name,
        email: demo.email.toLowerCase(),
        grade: demo.grade ?? "12",
        school_name: demo.schoolName ?? null,
        province: demo.province ?? null,
        municipality: demo.municipality ?? null,
        phone: "phone" in demo ? (demo.phone ?? null) : null,
        profile_id: profileId ?? null,
      },
      { onConflict: "email" },
    );
    if (error) throw error;
    console.log(`Upserted student ${demo.email}`);
  }

  // Curriculum singleton — never overwrite existing terms (admin uploads).
  // Insert empty Term 1–4 shells + badges only when the row is missing.
  const { data: existingCurriculum, error: curriculumReadError } = await admin
    .from("curriculum")
    .select("id, terms")
    .eq("id", "default")
    .maybeSingle();
  if (curriculumReadError) throw curriculumReadError;

  if (!existingCurriculum) {
    const { error: curriculumError } = await admin.from("curriculum").insert({
      id: "default",
      terms: createEmptyTerms(),
      badges: SEED_BADGES,
      updated_at: new Date().toISOString(),
    });
    if (curriculumError) throw curriculumError;
    console.log("Inserted curriculum (empty Term 1–4 shells + badges)");
  } else {
    const { error: badgesError } = await admin
      .from("curriculum")
      .update({
        badges: SEED_BADGES,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "default");
    if (badgesError) throw badgesError;
    console.log("Left curriculum terms unchanged; refreshed badges");
  }

  // Progress keyed by Auth UUID
  for (const row of SEED_PROGRESS) {
    const email = LEGACY_EMAIL[row.studentId];
    const studentId = email ? idByEmail.get(email) : undefined;
    if (!studentId) {
      console.warn(`Skip progress for unknown ${row.studentId}`);
      continue;
    }
    const { error } = await admin.from("student_progress").upsert({
      student_id: studentId,
      completed_lesson_ids: row.completedLessonIds,
      test_scores: row.testScores,
      badge_ids: row.badgeIds,
      overall_percent: row.overallPercent,
      status: row.status,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
  console.log(`Upserted ${SEED_PROGRESS.length} progress rows`);

  // Classes — wipe and recreate demo classes (idempotent by teacher email + name)
  await admin.from("class_members").delete().neq("student_id", "00000000-0000-0000-0000-000000000000");
  await admin.from("school_classes").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const classIdByLegacy: Record<string, string> = {};
  const classDefs = [
    {
      legacyId: "class-1",
      name: "Grade 12 Maths — A",
      teacherEmail: "teacher@ember12.za",
      students: ["student@ember12.za", "johan@ember12.za", "thabo@ember12.za", "nomsa@ember12.za"],
      pending: ["sipho@ember12.za"],
      createdAt: "2026-01-10T08:00:00.000Z",
    },
    {
      legacyId: "class-2",
      name: "Grade 12 Maths — B",
      teacherEmail: "dlamini@ember12.za",
      students: ["aisha@ember12.za", "pieter@ember12.za", "fatima@ember12.za", "zanele@ember12.za"],
      pending: [] as string[],
      createdAt: "2026-01-10T09:00:00.000Z",
    },
  ];

  for (const def of classDefs) {
    const teacherId = idByEmail.get(def.teacherEmail);
    if (!teacherId) {
      console.warn(`Skip class ${def.name}: missing teacher ${def.teacherEmail}`);
      continue;
    }
    const { data: created, error } = await admin
      .from("school_classes")
      .insert({
        name: def.name,
        teacher_id: teacherId,
        created_at: def.createdAt,
      })
      .select("id")
      .single();
    if (error || !created) throw error ?? new Error("class insert failed");
    classIdByLegacy[def.legacyId] = created.id;

    for (const email of def.students) {
      const studentId = idByEmail.get(email);
      if (!studentId) continue;
      const { error: memErr } = await admin.from("class_members").upsert({
        class_id: created.id,
        student_id: studentId,
        status: "enrolled",
      });
      if (memErr) throw memErr;
    }
    for (const email of def.pending) {
      const studentId = idByEmail.get(email);
      if (!studentId) continue;
      const { error: memErr } = await admin.from("class_members").upsert({
        class_id: created.id,
        student_id: studentId,
        status: "pending",
      });
      if (memErr) throw memErr;
    }
    console.log(`Seeded class ${def.name}`);
  }

  // Study groups
  await admin.from("study_group_members").delete().neq("student_id", "00000000-0000-0000-0000-000000000000");
  await admin.from("study_groups").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: group, error: groupErr } = await admin
    .from("study_groups")
    .insert({
      name: "Sequences Study Circle",
      description: "Peer practice for Term 1 patterns and series",
      term_id: "term-1",
      created_at: "2026-02-01T10:00:00.000Z",
    })
    .select("id")
    .single();
  if (groupErr || !group) throw groupErr ?? new Error("group insert failed");

  for (const email of ["student@ember12.za", "aisha@ember12.za"]) {
    const studentId = idByEmail.get(email);
    if (!studentId) continue;
    const { error } = await admin.from("study_group_members").upsert({
      group_id: group.id,
      student_id: studentId,
    });
    if (error) throw error;
  }
  console.log("Seeded study group");

  // Demo message teacher → parent
  await admin.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const teacherId = idByEmail.get("teacher@ember12.za");
  const parentId = idByEmail.get("parent@ember12.za");
  const studentId = idByEmail.get("student@ember12.za");
  if (teacherId && parentId && studentId) {
    const { error } = await admin.from("messages").insert({
      from_user_id: teacherId,
      to_user_id: parentId,
      student_id: studentId,
      body: "Lerato is strong on Number Patterns but needs revision on Series & Sigma Notation — please encourage Saturday test practice for Week 2.",
      read: false,
      created_at: "2026-02-10T14:00:00.000Z",
    });
    if (error) throw error;
    console.log("Seeded demo message");
  }

  void classIdByLegacy;
  console.log(`Seeded ${ALL_DEMO.length} users (password: ${DEMO_PASSWORD}) + app state.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
