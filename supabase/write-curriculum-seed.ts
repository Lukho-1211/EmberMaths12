/**
 * Writes supabase/seed-app-state.sql with curriculum JSON for Postgres seeding.
 * Run: npx tsx supabase/write-curriculum-seed.ts
 */
import { writeFileSync } from "node:fs";
import { SEED_BADGES } from "../src/lib/mock/seed";
import { SEED_TERMS } from "../src/lib/mock/curriculum";

function sqlString(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

const sql = `-- App state seed: curriculum singleton (terms + badges).
-- Run after migrations. Idempotent upsert.

insert into public.curriculum (id, terms, badges, updated_at)
values (
  'default',
  ${sqlString(SEED_TERMS)},
  ${sqlString(SEED_BADGES)},
  now()
)
on conflict (id) do update
  set terms = excluded.terms,
      badges = excluded.badges,
      updated_at = excluded.updated_at;
`;

writeFileSync(new URL("./seed-app-state.sql", import.meta.url), sql, "utf8");
console.log("Wrote supabase/seed-app-state.sql");
