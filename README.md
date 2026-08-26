# Ember Maths12

Online South African **CAPS Grade 12 Mathematics** school frontend — Udemy-style learning with Admin, Student, Teacher, and Parent portals.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS 4**. Requires **Node.js 22+**. **Auth, curriculum, progress, classes, and uploads** all use **Supabase** (Auth + Postgres + Storage). The React store is an in-memory cache that loads and writes through Supabase — nothing is persisted in `localStorage`.

## Documentation

| Doc | Purpose |
| --- | ------- |
| [`docs/PRD.md`](docs/PRD.md) | Product requirements (product law for features, gaps, and later work) |
| [`docs/tech_stack.md`](docs/tech_stack.md) | As-built stack: versions, clients, env vars, file map |
| [`design-system/embermaths12/MASTER.md`](design-system/embermaths12/MASTER.md) | Design tokens and component rules |

## Portals

| Portal | Base path |
| ------ | --------- |
| Admin | `/admin` |
| Student | `/student` |
| Teacher | `/teacher` |
| Parent | `/parent` |

Public entry: `/` (landing), `/login` → `/login/[role]`, `/signup` → `/signup/[role]`.

## Brand

Palette from `resourceInfo/colors.jpg` (Black & Gold Elegance):

| Token | Hex |
| ----- | --- |
| `ember-white` | `#FFFFFF` |
| `ember-gray` | `#E5E5E5` |
| `ember-gold` | `#FCA311` |
| `ember-navy` | `#14213D` |
| `ember-black` | `#000000` |

Typography: **Fraunces** (display) and **Outfit** (body) via `next/font`. Gold CTAs use **navy** text for contrast. Design tokens and component rules live in `design-system/embermaths12/`.

## Architecture

Canonical stack (versions and file map): [`docs/tech_stack.md`](docs/tech_stack.md).

| Layer | What it does today |
| ----- | ------------------ |
| **Supabase Auth** | Email/password signup and login for **admin**, **student**, **teacher**, and **parent**. Cookie session refresh via `src/proxy.ts` and `@supabase/ssr` clients in `src/lib/supabase/`. |
| **Postgres** | `public.profiles` (incl. theme), `public.student` roster, `curriculum`, `student_progress`, classes, groups, messages, corrections, teacher lessons. Migrations in `supabase/migrations/`. |
| **Storage** | `lesson-files` bucket for admin/teacher PDF and Markdown uploads. |
| **UI store** (`src/lib/store.tsx`) | In-memory `AppState` hydrated from Supabase on boot; mutations write back to Postgres. Session comes from Auth cookies only. |

Assessment submit, lesson complete, and curriculum fetch go through App Router API routes: the server scores MCQs, applies mock paper-scan grades, and strips answer keys/memos for non-admins.

Signup uses the browser Supabase client (`signUp`) so it works with only the publishable key. Role and name are stored in `user_metadata`; the `handle_new_user` trigger writes `public.profiles` (and `public.student` for students). Role for authorization is always read from `profiles`, not from editable metadata.

Optional: `POST /api/auth/signup` can still create pre-confirmed users when `SUPABASE_SERVICE_ROLE_KEY` is the real **service_role** secret (Dashboard → Project Settings → API). The anon/publishable JWT will return “User not allowed”. Admin user delete uses `POST /api/auth/delete-user`.

Env vars are required for Auth and for seeding.

The same emails are seeded into **Supabase Auth** + `profiles` (see `supabase/seed.ts` and `src/lib/demo-accounts.ts`). Extra demo students/teachers are created by the TypeScript seed so classes and rankings use Auth UUIDs.

Login and signup use role hubs (`/login`, `/signup`) that route into `/login/[role]` and `/signup/[role]`.

## Curriculum model (v1)

- Terms **1–4** (placeholder CAPS topics from the 2025 ATP in `resourceInfo/`)
- Each term: **Weeks 1–4** → Mon–Fri lessons (each with a **lesson test**) + **Saturday week test**
- After Week 4: **Pre-exam** and **past paper**

## Features

### Auth & profile

- Role-specific login and signup flows backed by **Supabase Auth** + `profiles`
- Demo accounts (after TypeScript seed — see [Database seed](#database-seed)) work on the live Auth project:

| Role | Email | Password |
| ---- | ----- | -------- |
| Admin | `admin@ember12.za` | `ember12` |
| Teacher | `teacher@ember12.za` | `ember12` |
| Student | `student@ember12.za` | `ember12` |
| Parent | `parent@ember12.za` | `ember12` |

- **Settings** (student / teacher / parent): name, email, password; students also set **province** and **municipality** for rankings — updates go to Auth + `profiles`
- Light / dark **theme** preference stored on `profiles.theme`

### Admin

| Route | What it does |
| ----- | ------------ |
| `/admin` | Dashboard stats and learner progress |
| `/admin/terms` | Upload/edit PDF/Markdown for daily lessons, Saturday week tests, pre-exams, and past papers |
| `/admin/users` | List teachers; delete student or parent accounts |
| `/admin/groups` | Create study groups, assign students, optional term link |
| `/admin/pass-fail` | Filter students by passing / failing / pending status |
| `/admin/achievers` | Leaderboard with province / municipality filters |

Saving a daily lesson with uploaded PDF/Markdown **mock-generates MCQ questions** from the document text (deterministic demo generation, not a live AI API). Admins can **Regenerate questions** from current materials.

Exam papers are shown to students (walkthrough + download). Memos are admin-only and used when correcting paper+scan uploads.

Files are stored in Supabase Storage (`lesson-files`, max **20 MB** per file). Admins can remove attachments and edit titles in place.

### Student

| Route | What it does |
| ----- | ------------ |
| `/student` | Progress ring, term insights, continue learning |
| `/student/learn` … `/[termId]/[weekId]/[day]` | Term → week → day lessons with Video / Text tabs; day test; mark complete |
| `/student/learn/[termId]/pre-exam` | Term pre-exam |
| `/student/past-papers` … | Practice loop (download, walkthrough, scan, mock feedback, share) |
| `/student/badges` | Milestone badges earned from progress |
| `/student/achievers` | Geographic rankings board |
| `/student/settings` | Profile, location, theme |

**Lesson player**

- **Video** — uploaded PDF/Markdown becomes a slide deck at view time (`pdfjs-dist` for PDFs): play/pause, prev/next, keyboard shortcuts, fullscreen
- **Text** — Markdown preview plus download links for PDFs and worksheets

Students must **pass** the day test before **Mark lesson complete** is enabled. Dashboards show **per-term insights** (strengths, weak topics, suggested next actions).

### Teacher

| Route | What it does |
| ----- | ------------ |
| `/teacher` | Dashboard |
| `/teacher/classes` | Create classes; search and enroll students |
| `/teacher/progress` | Per-class roster and term insights |
| `/teacher/achievers` | Class-scoped or geo rankings |
| `/teacher/lessons` | Create class-scoped lessons (not shown in student Learn — see [Known v1 gaps](#known-v1-gaps)) |
| `/teacher/messages` | Message parents of class students |
| `/teacher/settings` | Profile, theme |

### Parent

| Route | What it does |
| ----- | ------------ |
| `/parent` | Linked-child progress, badges, scores, term insights, past-paper attempts, and teacher messages |
| `/parent/settings` | Profile, theme |

Empty state when no child is linked (no self-service linking UI — see [Known v1 gaps](#known-v1-gaps)).

### Assessments

Default pass mark is **50%** for daily lesson tests, Saturday week tests, and pre-exams. Past papers are practice-only and **do not** affect pass/fail.

Two modes (submitted via server API routes):

1. **On-screen MCQ** — answer in the browser; server scores against curriculum keys and the pass mark.
2. **Paper + scan** — read the questions, work on paper, upload a photo/PDF of your script, then receive a **mock mark and per-question feedback** (deterministic demo grading, not real OCR).

### Past papers (practice)

Extreme-corner practice loop (separate from pass/fail):

1. Admin uploads a previous exam PDF (+ optional memo) per term under **Admin → Terms → Past papers**.
2. Student opens **Past papers**, downloads / walks through the paper, writes answers on paper.
3. Student scans or uploads a photo/PDF of their script.
4. System returns a **mock mark and per-question feedback**.
5. Feedback appears in-app; parents see practice attempts; **Share results** copies a summary to the clipboard.

### Rankings & geography

Top Achievers boards (admin, teacher, student) rank by overall progress percent, with optional **province** and **municipality** filters (South African geography helpers in `src/lib/sa-geography.ts`). Progress status is `pending` / `passing` (≥ 50%) / `failing`.

## API routes

| Route | Purpose |
| ----- | ------- |
| `POST /api/auth/signup` | Optional pre-confirmed signup when the real **service_role** secret is set |
| `POST /api/auth/delete-user` | Admin user delete (service role) |
| `GET /api/curriculum` | Authed curriculum fetch — admins get answer keys/memos; others get stripped |
| `POST /api/assessments/mcq` | Student MCQ submit — server scores against curriculum keys; updates progress |
| `POST /api/assessments/paper-scan` | Student paper-scan mock grade; practice/past-paper skips pass/fail |
| `POST /api/progress/complete-lesson` | Mark lesson complete; gated on passing `lessonTest` when present |

## Known v1 gaps

Do not invent these unless a task asks for them (full detail in [`docs/PRD.md`](docs/PRD.md) §7):

- No parent–child self-service linking UI (schema + seed only)
- No student class-join UI (teachers enroll students directly)
- Teacher lessons are not integrated into student Learn
- Study groups are admin-managed only (no student group experience)

## Local development

Create `.env.local` (do not commit it):

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
# Server/seed only — never expose to the browser.
# Must be the service_role secret (Dashboard → Project Settings → API), not the anon/publishable key.
SUPABASE_SERVICE_ROLE_KEY=
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is accepted as a fallback for the publishable key.

Signup in the UI uses the **publishable** key. `SUPABASE_SERVICE_ROLE_KEY` is only needed for `npx tsx supabase/seed.ts` and the optional admin signup API — it must be the **service_role** secret, not the anon key.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database seed

After linking the [Supabase CLI](https://supabase.com/docs/guides/cli) to the project and applying migrations (`supabase db push` or `supabase migration up`):

```bash
npx tsx supabase/write-curriculum-seed.ts
npx supabase db query -f supabase/seed-app-state.sql
npx tsx supabase/seed.ts
```

- `write-curriculum-seed.ts` — generates `supabase/seed-app-state.sql` (gitignored) from the CAPS terms/badges JSON; then query that file to upsert `public.curriculum`.
- `supabase/seed.ts` — core and extra demo accounts (`ember12` password), progress, classes, groups, and messages via the service role key.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js**.
4. Set the same Supabase env vars as `.env.local`.
5. Deploy.

Or with the Vercel CLI:

```bash
npm i -g vercel
vercel
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript (`tsc --noEmit`)
- `npm test` — Vitest unit tests (`tests/unit/`; config in `vitest.config.mts`)
- `npm run test:watch` — Vitest watch mode

## CI

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) on push and pull request (Node 22): `npm run lint` → `npm run typecheck` → `npm test`.

## Out of scope (frontend v1)

Live video hosting, real OCR/AI correction, email confirmation flows, and payments. Product data lives in Supabase Postgres + Storage; the UI store is an in-memory cache only.
