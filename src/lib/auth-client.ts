import type { Role } from "@/lib/types";

export type AuthSessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  province?: string;
  municipality?: string;
};

export type AuthResult =
  | { ok: true; user: AuthSessionUser }
  | { ok: false; error: string };

type SessionPayload = {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: Role;
    province?: string;
    municipality?: string;
  } | null;
};

function sessionUserFrom(raw: SessionPayload["user"]): AuthSessionUser | null {
  if (!raw?.id || !raw.email || !raw.role) return null;
  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email,
    role: raw.role,
    province: raw.province,
    municipality: raw.municipality,
  };
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/auth/csrf");
  if (!res.ok) throw new Error("Failed to fetch CSRF token.");
  const data = (await res.json()) as { csrfToken?: string };
  if (!data.csrfToken) throw new Error("Missing CSRF token.");
  return data.csrfToken;
}

export async function fetchAuthSession(): Promise<AuthSessionUser | null> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return null;
  const data = (await res.json()) as SessionPayload;
  return sessionUserFrom(data.user);
}

export async function credentialsSignIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken,
        email,
        password,
        redirect: "false",
        json: "true",
      }),
      credentials: "include",
    });

    if (!res.ok) {
      return { ok: false, error: "Invalid email or password." };
    }

    const payload = (await res.json().catch(() => null)) as {
      url?: string;
      error?: string;
    } | null;

    if (payload?.error) {
      return { ok: false, error: "Invalid email or password." };
    }

    const user = await fetchAuthSession();
    if (!user) {
      return { ok: false, error: "Invalid email or password." };
    }
    return { ok: true, user };
  } catch {
    return { ok: false, error: "Invalid email or password." };
  }
}

export async function credentialsSignOut(): Promise<void> {
  try {
    const csrfToken = await getCsrfToken();
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken,
        callbackUrl: "/",
        json: "true",
      }),
      credentials: "include",
    });
  } catch {
    /* ignore sign-out network errors */
  }
}

export async function signupAccount(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  province?: string;
  municipality?: string;
}): Promise<AuthResult> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = (await res.json()) as
    | { ok: true; user: AuthSessionUser & { createdAt?: string } }
    | { ok: false; error: string };

  if (!data.ok) {
    return { ok: false, error: data.error || "Signup failed." };
  }

  const signedIn = await credentialsSignIn(input.email, input.password);
  if (!signedIn.ok) {
    return {
      ok: false,
      error: "Account created but sign-in failed. Please log in.",
    };
  }
  return signedIn;
}
