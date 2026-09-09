/**
 * Writes supabase/seed-app-state.sql with empty Term 1–4 shells + badges.
 * Does not overwrite existing curriculum.terms on conflict (admin uploads win).
 * Run: npx tsx supabase/write-curriculum-seed.ts
 */
import { writeFileSync } from "node:fs";
import { createEmptyTerms } from "../src/lib/curriculum/empty-terms";
import { SEED_BADGES } from "../src/lib/mock/seed";

function sqlString(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

const sql = `-- App state seed: curriculum singleton (empty Term 1–4 shells + badges).
-- Run after migrations. Idempotent: inserts if missing; on conflict refreshes badges only (never replaces terms).

insert into public.curriculum (id, terms, badges, updated_at)
values (
  'default',
  ${sqlString(createEmptyTerms())},
  ${sqlString(SEED_BADGES)},
  now()
)
on conflict (id) do update
  set badges = excluded.badges,
      updated_at = excluded.updated_at;
`;

writeFileSync(new URL("./seed-app-state.sql", import.meta.url), sql, "utf8");
console.log("Wrote supabase/seed-app-state.sql (empty shells; conflict preserves terms)");
