import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRole } from "@/lib/roles";
import { isValidMunicipality } from "@/lib/sa-geography";
import type { Role } from "@/lib/types";

type SignupBody = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  province?: string;
  municipality?: string;
};

/**
 * Optional server signup via service role (pre-confirms email).
 * The app UI uses browser `signUp` instead so it works with only the publishable key.
 * Keep this route for tooling / when SUPABASE_SERVICE_ROLE_KEY is set correctly.
 */
export async function POST(request: Request) {
  let body: SignupBody;
  try {
    body = (await request.json()) as SignupBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const roleRaw = body.role?.trim() ?? "";
  const province = body.province?.trim() || undefined;
  const municipality = body.municipality?.trim() || undefined;

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
  if (!isRole(roleRaw)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }
  const role: Role = roleRaw;

  if (role === "admin") {
    return NextResponse.json(
      { error: "Admin accounts cannot be created via public signup." },
      { status: 403 },
    );
  }

  if (role === "student") {
    if (!province || !municipality) {
      return NextResponse.json(
        { error: "Province and municipality are required for students." },
        { status: 400 },
      );
    }
    if (!isValidMunicipality(province, municipality)) {
      return NextResponse.json(
        { error: "Please select a valid municipality for the chosen province." },
        { status: 400 },
      );
    }
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        ...(role === "student" ? { province, municipality, grade: "12" } : {}),
      },
      app_metadata: {
        role,
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

    return NextResponse.json({
      ok: true,
      userId: data.user?.id,
      email,
      role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
