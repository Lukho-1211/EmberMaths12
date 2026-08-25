import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export type AuthedUser = {
  id: string;
  role: Role;
};

/**
 * Cookie session + profiles.role (never user_metadata).
 * Returns AuthedUser or a NextResponse error to return from the route.
 */
export async function requireUser(
  allowedRoles?: Role[],
): Promise<AuthedUser | NextResponse> {
  const supabase = await createClient();
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

  if (!profile?.role) {
    return NextResponse.json({ error: "Profile not found." }, { status: 403 });
  }

  const role = profile.role as Role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  return { id: user.id, role };
}

export function isAuthedUser(
  value: AuthedUser | NextResponse,
): value is AuthedUser {
  return !(value instanceof NextResponse) && "id" in value && "role" in value;
}
