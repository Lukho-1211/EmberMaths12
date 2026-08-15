import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { DEMO_DB_USERS, DEMO_PASSWORD } from "../src/lib/demo-accounts";

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

  for (const demo of DEMO_DB_USERS) {
    const email = demo.email.toLowerCase();
    const metadata = {
      name: demo.name,
      role: demo.role,
      province: demo.province ?? null,
      municipality: demo.municipality ?? null,
      grade: demo.grade ?? null,
      school_name: demo.schoolName ?? null,
      phone: demo.phone ?? null,
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
        phone: demo.phone ?? null,
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
      phone: demo.phone ?? null,
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

  for (const demo of DEMO_DB_USERS) {
    if (!demo.parentEmail) continue;
    const studentId = idByEmail.get(demo.email.toLowerCase());
    const parentId = idByEmail.get(demo.parentEmail.toLowerCase());
    if (!studentId || !parentId) continue;
    const { error } = await admin.from("profiles").update({ parent_id: parentId }).eq("id", studentId);
    if (error) throw error;
    console.log(`Linked ${demo.email} → parent ${demo.parentEmail}`);
  }

  for (const demo of DEMO_DB_USERS.filter((u) => u.role === "student")) {
    const profileId = idByEmail.get(demo.email.toLowerCase());
    const { error } = await admin.from("student").upsert(
      {
        name: demo.name,
        email: demo.email.toLowerCase(),
        grade: demo.grade ?? "12",
        school_name: demo.schoolName ?? null,
        province: demo.province ?? null,
        municipality: demo.municipality ?? null,
        phone: demo.phone ?? null,
        profile_id: profileId ?? null,
      },
      { onConflict: "email" },
    );
    if (error) throw error;
    console.log(`Upserted student ${demo.email}`);
  }

  console.log(`Seeded ${DEMO_DB_USERS.length} users (password: ${DEMO_PASSWORD}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
