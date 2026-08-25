import { NextResponse } from "next/server";
import { stripCurriculumPayload } from "@/lib/domain";
import { isAuthedUser, requireUser } from "@/lib/supabase/require-user";
import { loadCurriculumServer } from "@/lib/supabase/progress-server";

/**
 * Authed curriculum fetch. Admins get full JSON (answers + memos);
 * everyone else gets stripped secrets.
 */
export async function GET() {
  const auth = await requireUser();
  if (!isAuthedUser(auth)) return auth;

  try {
    const { terms, badges } = await loadCurriculumServer({ role: auth.role });
    const payload = stripCurriculumPayload(terms, badges, auth.role === "admin");
    return NextResponse.json({ ok: true, ...payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load curriculum.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
