# Ember Maths12 — Tech Stack

**Audience:** humans and agents implementing or reviewing code  
**Product behaviour:** [`PRD.md`](PRD.md)  
**Coding conventions:** [`.cursor/rules/ember12.mdc`](../.cursor/rules/ember12.mdc)

This file is the as-built stack: what we use, which versions, and where it lives. It does not replace the PRD.

---

## Runtime & app framework

| Piece | Version (from [`package.json`](../package.json)) | Notes |
| ----- | ------------------------------------------------ | ----- |
| Node.js | 22+ (`engines.node`) | Required |
| Next.js | 16.3.0 | App Router under `src/app/` |
| React / React DOM | 19.2.8 | |
| TypeScript | 5 | `strict: true` |

Path alias: `@/` → `src/` ([`tsconfig.json`](../tsconfig.json)).

Before adding Next.js APIs, read `node_modules/next/dist/docs/` — this Next version differs from older training data.

**Session refresh** lives in [`src/proxy.ts`](../src/proxy.ts) (Next 16), not `middleware.ts`. The proxy calls [`src/lib/supabase/middleware.ts`](../src/lib/supabase/middleware.ts).

---

## Data layer — Supabase only

Product data is **Supabase** Auth + Postgres + Storage. The React store is an in-memory cache that hydrates and mutates through Supabase. Do **not** persist app state in `localStorage`.

```mermaid
flowchart LR
  Browser["Browser client"] --> Store["store.tsx in-memory cache"]
  Store --> AppState["app-state.ts"]
  AppState --> CurriculumAPI["GET /api/curriculum"]
  AppState --> Postgres["Supabase Postgres"]
  Browser --> Auth["Supabase Auth cookies"]
  Proxy["proxy.ts"] --> Auth
  Server["RSC server.ts"] --> Auth
  AdminAPI["admin.ts service role"] --> Postgres
  AdminAPI --> LessonFiles["Storage lesson-files"]
  AdminAPI --> LessonVideos["Storage lesson-videos"]
```

### Auth clients

| Client | File | Key | Use |
| ------ | ---- | --- | --- |
| Browser | [`src/lib/supabase/client.ts`](../src/lib/supabase/client.ts) | Publishable / anon | Signup, login, client mutations |
| RSC | [`src/lib/supabase/server.ts`](../src/lib/supabase/server.ts) | Publishable / anon | Server Components, cookie session |
| Session refresh | [`src/lib/supabase/middleware.ts`](../src/lib/supabase/middleware.ts) via [`src/proxy.ts`](../src/proxy.ts) | Publishable / anon | Refresh Auth cookies on matched requests |
| Service role | [`src/lib/supabase/admin.ts`](../src/lib/supabase/admin.ts) | `SUPABASE_SERVICE_ROLE_KEY` | Server and seed only — never expose to the browser |

Libraries: `@supabase/ssr` and `@supabase/supabase-js`.

**Authorization role always comes from `public.profiles`, never from editable `user_metadata`.** Signup may write role/name into `user_metadata` so the `handle_new_user` trigger can create the profile; runtime checks read `profiles.role`.

**Admin lock** (migration `20260905102918`): `handle_new_user` assigns `admin` only when Auth `app_metadata.role = admin` (service-role `createUser` / [`POST /api/auth/create-admin`](../src/app/api/auth/create-admin/route.ts)). Crafted `user_metadata.role = admin` on public signup becomes `student`. The trigger syncs the resolved role into `app_metadata`.

### Postgres

Migrations live in [`supabase/migrations/`](../supabase/migrations/). Core tables include `profiles` (role, theme, location, `parent_id`), `student`, curriculum, progress, classes, groups, messages, corrections, and teacher lessons. RLS is defined in those migrations. Non-admins cannot SELECT the `curriculum` table directly — they load via `GET /api/curriculum`.

Local CLI project id: `Ember12` ([`supabase/config.toml`](../supabase/config.toml)).

### Storage

| Bucket | Purpose |
| ------ | ------- |
| `lesson-files` | Admin/teacher PDF and Markdown uploads (max 20 MB per file) |
| `lesson-videos` | Admin-uploaded lesson mp4s only (max ~200 MB; public read) |
| `student-scans` | Private student week-test paper scans (images/PDF, max 20 MB; path `{studentId}/{assessmentId}/…`) |
| `profile-avatars` | User profile photos |

Hosted lesson video URLs are stored on curriculum `Lesson.videoUrl` (no separate job table). Upload/delete helpers: [`src/lib/supabase/lesson-videos.ts`](../src/lib/supabase/lesson-videos.ts). Scan upload helper: [`src/lib/supabase/student-scans.ts`](../src/lib/supabase/student-scans.ts).

### UI store

[`src/lib/store.tsx`](../src/lib/store.tsx) holds in-memory `AppState`. Load and write through [`src/lib/supabase/app-state.ts`](../src/lib/supabase/app-state.ts), which hydrates curriculum via `GET /api/curriculum`. Session identity comes from Auth cookies only. API routes gate with [`src/lib/supabase/require-user.ts`](../src/lib/supabase/require-user.ts); progress/correction server I/O lives in [`src/lib/supabase/progress-server.ts`](../src/lib/supabase/progress-server.ts).

### Not the data layer

[`src/generated/prisma/`](../src/generated/prisma/) is leftover generated code. There is no Prisma dependency in `package.json`. Do not treat it as the app data layer.

---

## UI

| Piece | Detail |
| ----- | ------ |
| Tailwind CSS | 4, via `@tailwindcss/postcss` ([`postcss.config.mjs`](../postcss.config.mjs), [`src/app/globals.css`](../src/app/globals.css)) |
| Icons | `lucide-react` |
| Charts | `recharts` |
| PDF slides | `pdfjs-dist` in [`src/lib/lesson-video/`](../src/lib/lesson-video/) |
| Design system | [`design-system/embermaths12/MASTER.md`](../design-system/embermaths12/MASTER.md); page files under `design-system/embermaths12/pages/` override when present |

Fonts via `next/font` only in [`src/app/layout.tsx`](../src/app/layout.tsx) — **Fraunces** (display) and **Outfit** (body). No Google Fonts `@import`.

Brand tokens:

| Token | Hex |
| ----- | --- |
| `ember-gold` | `#FCA311` |
| `ember-navy` | `#14213D` |
| `ember-black` | `#000000` |
| `ember-white` | `#FFFFFF` |
| `ember-gray` | `#E5E5E5` |

Gold CTAs use **navy** text for contrast.

---

## API routes

Normal signup and login use the browser Supabase client. App Router APIs:

| Route | Purpose |
| ----- | ------- |
| [`src/app/api/auth/signup/route.ts`](../src/app/api/auth/signup/route.ts) | Optional pre-confirmed signup when the real **service_role** secret is set |
| [`src/app/api/auth/create-admin/route.ts`](../src/app/api/auth/create-admin/route.ts) | Admin-only: create admin via service role; sets `app_metadata.role = admin` |
| [`src/app/api/auth/delete-user/route.ts`](../src/app/api/auth/delete-user/route.ts) | Admin user delete (service role) |
| [`src/app/api/curriculum/route.ts`](../src/app/api/curriculum/route.ts) | Authed curriculum fetch — admins get answer keys/memos; others get stripped |
| [`src/app/api/assessments/mcq/route.ts`](../src/app/api/assessments/mcq/route.ts) | Student MCQ submit — server scores against curriculum keys; updates progress |
| [`src/app/api/assessments/paper-scan/route.ts`](../src/app/api/assessments/paper-scan/route.ts) | Student paper-scan grade — **Saturday week tests:** Gemini memo marking via [`grade-week-test-scan.ts`](../src/lib/grade-week-test-scan.ts); other kinds still mock; practice/past-paper skips pass/fail |
| [`src/app/api/progress/complete-lesson/route.ts`](../src/app/api/progress/complete-lesson/route.ts) | Mark lesson complete; gated on passing `lessonTest` when present |

Domain helpers (scoring, strip secrets, find assessment): [`src/lib/domain/`](../src/lib/domain/). Progress/correction writes go through security-definer RPCs (`upsert_student_progress`, `insert_correction_row`) invoked by the API with the cookie session after `profiles.role` checks — students cannot upsert those tables directly. Full curriculum (answer keys) is loaded server-side via service role / `get_curriculum_row` (service_role only) or seed fallback; clients use `GET /api/curriculum` which strips secrets for non-admins.

---

## Tooling & deploy

| Tool | Role |
| ---- | ---- |
| ESLint 9 + `eslint-config-next` 16.3.0 | `npm run lint` |
| TypeScript `tsc --noEmit` | `npm run typecheck` |
| Vitest 4 | `npm test` / `npm run test:watch` — [`vitest.config.mts`](../vitest.config.mts), unit tests in `tests/unit/` |
| Vercel | Deploy target (Next.js preset) |

---

## Environment variables

Set in `.env.local` (do not commit) and in the Vercel project:

| Variable | Where it is used |
| -------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser, RSC, and proxy (preferred) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Fallback if the publishable key is unset |
| `SUPABASE_SERVICE_ROLE_KEY` | [`admin.ts`](../src/lib/supabase/admin.ts), seed scripts, optional signup/delete APIs — **never** expose to the browser |
| `GEMINI_API_KEY` | Server-only — Saturday week-test paper marking in [`grade-week-test-scan.ts`](../src/lib/grade-week-test-scan.ts) |
| `GEMINI_MODEL` | Optional; defaults to `gemini-3.6-flash` |

---

## Out of stack (v1)

Live / streaming video hosting, email confirmation productization, and payments. **L2** Saturday week-test real memo marking is **shipped** (Gemini + `student-scans`). Other paper-scan paths and live MCQ generation still use mocks until replaced. Pre-rendered lesson mp4s are uploaded by admins (Storage `lesson-videos`).
