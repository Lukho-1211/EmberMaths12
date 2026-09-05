import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Body = {
  name?: string;
  email?: string;
  password?: string;
};

/**
 * Admin-only: create another admin Auth user (pre-confirmed email).
 * Role is set via app_metadata so handle_new_user accepts admin.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create admin accounts." },
        { status: 403 },
      );
    }

    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "admin",
      },
      app_metadata: {
        role: "admin",
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("not allowed") || message.includes("forbidden")) {
        return NextResponse.json(
          {
            error:
              "SUPABASE_SERVICE_ROLE_KEY is missing or is not the service_role secret (anon/publishable keys cannot create users via admin API).",
          },
          { status: 400 },
        );
      }
      if (
        message.includes("already") ||
        message.includes("registered") ||
        message.includes("exists")
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "User created but no id returned." }, { status: 500 });
    }

    // createUser may apply app_metadata after the INSERT trigger runs, so the
    // trigger can miss admin. Force the profile (+ app_metadata) to admin.
    const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { role: "admin" },
      user_metadata: { name, role: "admin" },
    });
    if (metaError) {
      return NextResponse.json({ error: metaError.message }, { status: 400 });
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      name,
      email,
      role: "admin",
    });
    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Prefer the profile row after the forced admin upsert.
    let createdProfile: {
      id: string;
      name: string;
      email: string;
      role: string;
      province: string | null;
      municipality: string | null;
      parent_id: string | null;
      created_at: string;
    } | null = null;

    for (let i = 0; i < 5; i++) {
      const { data: row } = await admin
        .from("profiles")
        .select("id, name, email, role, province, municipality, parent_id, created_at")
        .eq("id", userId)
        .maybeSingle();
      if (row?.role === "admin") {
        createdProfile = row;
        break;
      }
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }

    if (!createdProfile || createdProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin user created but profile role could not be confirmed." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      user: createdProfile,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Create admin failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
