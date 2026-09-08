import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/types";

export type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  province: string | null;
  municipality: string | null;
  parent_id: string | null;
  avatar_url: string | null;
  created_at: string;
};

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    return { ok: false as const, error: error.message };
  }
  return { ok: true as const, user: data.user };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getSessionUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, province, municipality, parent_id, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as ProfileRow;
}

/** Wait briefly for the handle_new_user trigger to create the profile row. */
export async function getProfileWithRetry(
  userId: string,
  attempts = 5,
): Promise<ProfileRow | null> {
  for (let i = 0; i < attempts; i++) {
    const profile = await getProfile(userId);
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, 200 * (i + 1)));
  }
  return null;
}

/**
 * Sign up with the browser (publishable) client.
 * Does not need the service role key. Role/name land in user_metadata;
 * handle_new_user copies them into profiles (+ student roster).
 */
export async function signUpWithPassword(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  province?: string;
  municipality?: string;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const email = input.email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
        ...(input.role === "student"
          ? {
              province: input.province,
              municipality: input.municipality,
              grade: "12",
            }
          : {}),
      },
    },
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate limit")) {
      return {
        ok: false,
        error:
          "Email rate limit exceeded. In Supabase Dashboard → Authentication → Providers → Email, turn Confirm email OFF (no mail is sent then). Wait about an hour if you already hit the limit, then try again with a real email (e.g. Gmail).",
      };
    }
    if (
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists")
    ) {
      return { ok: false, error: "An account with this email already exists." };
    }
    if (message.includes("invalid") && message.includes("email")) {
      return {
        ok: false,
        error:
          "That email address is not accepted. Use a real inbox domain (e.g. Gmail), not @example.com or @ember12.za.",
      };
    }
    return { ok: false, error: error.message };
  }

  let userId = data.user?.id;
  if (!data.session) {
    // Email confirmation may be required — try immediate sign-in anyway.
    const signedIn = await signInWithPassword(email, input.password);
    if (!signedIn.ok) {
      return {
        ok: false,
        error:
          "Account created, but email confirmation is required before you can log in. In Supabase Dashboard → Authentication → Providers → Email, turn off “Confirm email”, or confirm via the email link.",
      };
    }
    userId = signedIn.user.id;
  }

  if (!userId) {
    return { ok: false, error: "Signup failed — no user returned." };
  }

  return { ok: true, userId };
}
