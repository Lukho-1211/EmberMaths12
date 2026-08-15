# Ember Maths12

Online South African **CAPS Grade 12 Mathematics** school frontend — Udemy-style learning with Admin, Student, Teacher, and Parent portals.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS 4**. **Auth, curriculum, progress, classes, and uploads** all use **Supabase** (Auth + Postgres + Storage). The React store is an in-memory cache that loads and writes through Supabase — nothing is persisted in `localStorage`.

## Brand

Palette from `resourceInfo/colors.jpg` (Black & Gold Elegance):

| Token      | Hex       |
| ---------- | --------- |
| White      | `#FFFFFF` |
| Light gray | `#E5E5E5` |
| Gold       | `#FCA311` |
| Navy       | `#14213D` |
| Black      | `#000000` |

Typography: **Fraunces** (display) and **Outfit** (body) via `next/font`. Design tokens and component rules live in `design-system/embermaths12/`.

## Architecture

| Layer | What it does today |
| ----- | ------------------ |
| **Supabase Auth** | Email/password signup and login for **admin**, **student**, **teacher**, and **parent**. Cookie session refresh via `src/proxy.ts` and `@supabase/ssr` clients in `src/lib/supabase/`. |
| **Postgres** | `public.profiles` (incl. theme), `public.student` roster, `curriculum`, `student_progress`, classes, groups, messages, corrections, teacher lessons. Migrations in `supabase/migrations/`. |
| **Storage** | `lesson-files` bucket for admin/teacher PDF and Markdown uploads. |
| **UI store** (`src/lib/store.tsx`) | In-memory `AppState` hydrated from Supabase on boot; mutations write back to Postgres. Session comes from Auth cookies only. |

Signup uses the browser Supabase client (`signUp`) so it works with only the publishable key. Role and name are stored in `user_metadata`; the `handle_new_user` trigger writes `public.profiles` (and `public.student` for students). Role for authorization is always read from `profiles`, not from editable metadata.

Optional: `POST /api/auth/signup` can still create pre-confirmed users when `SUPABASE_SERVICE_ROLE_KEY` is the real **service_role** secret (Dashboard → Project Settings → API). The anon/publishable JWT will return “User not allowed”. Admin user delete uses `POST /api/auth/delete-user`.

Env vars are required for Auth and for seeding.

## Demo accounts

Password for all demos: `ember12`

| Role    | Email                |
| ------- | -------------------- |
| Admin   | `admin@ember12.za`   |
| Student | `student@ember12.za` |
| Teacher | `teacher@ember12.za` |
| Parent  | `parent@ember12.za`  |

The same emails are seeded into **Supabase Auth** + `profiles` (see `supabase/seed.sql`, `npm run db:seed:app`, and `src/lib/demo-accounts.ts`). Extra demo students/teachers are created by the TypeScript seed so classes and rankings use Auth UUIDs.

Login and signup use role hubs (`/login`, `/signup`) that route into `/login/[role]` and `/signup/[role]`.

## Curriculum model (v1)

- Terms **1–4** (placeholder CAPS topics from the 2025 ATP in `resourceInfo/`)
- Each term: **Weeks 1–4** → Mon–Fri lessons (each with a **lesson test**) + **Saturday week test**
- After Week 4: **Pre-exam**

## Features

### Auth & profile

- Role-specific login and signup flows backed by **Supabase Auth** + `profiles`
- Demo accounts (after `npm run db:seed` and `npm run db:seed:app`) work on the live Auth project
- **Settings** (student / teacher / parent): name, email, password; students also set **province** and **municipality** for rankings — updates go to Auth + `profiles`
- Light / dark **theme** preference stored on `profiles.theme`

### Admin

| Area | What it does |
| ---- | ------------ |
| **Terms & Lessons** | Upload PDF/Markdown for daily lessons, Saturday week tests, pre-exams, and past papers |
| **Users & Teachers** | Manage demo users |
| **Study Groups** | Create groups, assign students, optional term link |
| **Pass / Fail** | Filter students by passing / failing / pending status |
| **Top Achievers** | Leaderboard with province / municipality filters |

Saving a daily lesson with uploaded PDF/Markdown **mock-generates MCQ questions** from the document text (deterministic demo generation, not a live AI API). Admins can **Regenerate questions** from current materials.

Exam papers are shown to students (walkthrough + download). Memos are admin-only and used when correcting paper+scan uploads.

Files are stored in Supabase Storage (`lesson-files`, max **20 MB** per file). Admins can remove attachments and edit titles in place.

### Student

| Area | What it does |
| ---- | ------------ |
| **Learn** | Term → week → day lessons with Video / Text tabs; required day tests; week tests & pre-exams |
| **Past papers** | Practice loop separate from pass/fail (download, scan script, mock feedback) |
| **Badges** | Milestone badges earned from progress |
| **Top Achievers** | Geographic rankings board |
| **Settings** | Profile, location, theme |

**Lesson player**

- **Video** — uploaded PDF/Markdown becomes a slide deck at view time (`pdfjs-dist` for PDFs): play/pause, prev/next, keyboard shortcuts, fullscreen
- **Text** — Markdown preview plus download links for PDFs and worksheets

Students must **pass** the day test before **Mark lesson complete** is enabled. Dashboards show **per-term insights** (strengths, weak topics, suggested next actions).

### Teacher

Dashboard, **Classes**, **Progress**, **Top Achievers** (class-scoped rankings), **Lessons**, **Parent Messages**, and **Settings**.

### Parent

Linked-child **Progress** (including practice attempts) and **Settings**.

### Assessments

Daily lesson tests, Saturday week tests, and pre-exams support two modes:

1. **On-screen MCQ** — answer in the browser; score against the pass mark.
2. **Paper + scan** — read the questions, work on paper, upload a photo/PDF of your script, then receive a **mock mark and per-question feedback** (deterministic demo grading, not real OCR).

### Past papers (practice)

Extreme-corner practice loop (separate from pass/fail):

1. Admin uploads a previous exam PDF (+ optional memo) per term under **Admin → Terms → Past papers**.
2. Student opens **Past papers**, downloads / walks through the paper, writes answers on paper.
3. Student scans or uploads a photo/PDF of their script.
4. System returns a **mock mark and per-question feedback**.
5. Feedback appears in-app; parents see practice attempts; **Share results** copies a summary to the clipboard.

### Rankings & geography

Top Achievers boards (admin, teacher, student) rank by overall progress percent, with optional **province** and **municipality** filters (South African geography helpers in `src/lib/sa-geography.ts`).

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

Signup in the UI uses the **publishable** key. `SUPABASE_SERVICE_ROLE_KEY` is only needed for `npm run db:seed:app` / optional admin signup API — it must be the **service_role** secret, not the anon key.

```bash
npm install
npm run db:seed:curriculum
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database seed

After linking the Supabase CLI to the project and applying migrations:

```bash
npm run db:seed
npm run db:seed:curriculum
npm run db:seed:app
```

`db:seed` runs `supabase/seed.sql` (core demo Auth users). `db:seed:curriculum` upserts the CAPS terms/badges JSON into `public.curriculum`. `db:seed:app` runs `supabase/seed.ts` via the service role key (extra demo accounts, progress, classes, groups, messages) — requires a valid `SUPABASE_SERVICE_ROLE_KEY`.

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
- `npm run db:seed` — seed demo Auth users and roster on the linked Supabase project
- `npm run db:seed:app` — seed curriculum + demo app data via service role (`supabase/seed.ts`)

## Out of scope (frontend v1)

Live video hosting, real OCR/AI correction, email confirmation flows, and payments. Product data lives in Supabase Postgres + Storage; the UI store is an in-memory cache only.
