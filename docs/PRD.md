# Ember Maths12 — Product Requirements Document

**Status:** v1 as-built + **L2 now** (`in-progress`) + proposed later  
**Audience:** Cursor agents and humans implementing product work  
**Stack conventions:** see [`.cursor/rules/ember12.mdc`](../.cursor/rules/ember12.mdc). **As-built stack (versions and files):** [`tech_stack.md`](tech_stack.md).

Status tags used below: `shipped` | `mock` | `in-progress` | `gap` | `later`

---

## 1. How Cursor uses this file

Treat this document as **product law** for Ember Maths12.

- **MUST** read this file before product, UX, routing, or feature work.
- **MUST NOT** add portals, roles, payments, live video hosting, or email confirmation unless a task explicitly moves an item from **Later** → **Now**. **L2** (real OCR / AI grading) is **now** — implement it; do not keep paper-scan or MCQ generation as a permanent mock.
- **MUST NOT** invent UI for known gaps (section 7) unless the task asks for that gap.
- If a user request **conflicts** with this PRD, follow the PRD and say so briefly.
- Coding stack, auth keys, and UI tokens live in `.cursor/rules/ember12.mdc` — do not contradict them here. Versions and file map: [`tech_stack.md`](tech_stack.md).

---

## 2. Vision

Ember Maths12 is an online South African **CAPS Grade 12 Mathematics** school frontend: Udemy-style learning with four role portals.

| Portal | Base path |
|--------|-----------|
| Admin | `/admin` |
| Student | `/student` |
| Teacher | `/teacher` |
| Parent | `/parent` |

Public entry: `/` (landing), `/login` → `/login/[role]`, `/signup` → `/signup/[role]` (student, teacher, parent). Admin is login-only publicly.

---

## 3. Users & jobs

| Role | Primary jobs |
|------|----------------|
| **Admin** | Upload/edit curriculum (lessons, week tests, pre-exams, past papers); manage users/teachers; study groups; pass/fail; school-wide Top Achievers |
| **Student** | Learn by term → week → day; pass day tests; week tests & pre-exams; past-paper practice; badges; rankings; settings (incl. province/municipality) |
| **Teacher** | Classes (enroll students); progress & term insights; class/geo rankings; create teacher lessons; message parents; settings |
| **Parent** | View linked child progress, badges, scores, term insights, past-paper attempts, inbound teacher messages; settings |

---

## 4. Product principles

| Principle | Requirement |
|-----------|-------------|
| Curriculum shape | Terms 1–4 → Weeks (Mon–Fri lessons + Saturday week test; admin may add beyond 4) → pre-exam + past paper |
| Authorization | Role **always** from `public.profiles` at runtime, never editable `user_metadata`. **Admin assignment** requires Auth `app_metadata.role = admin` (service-role `createUser` / `POST /api/auth/create-admin`); public signup `user_metadata` cannot grant admin |
| Persistence | Product data in **Supabase** (Auth + Postgres + Storage). UI store is an in-memory cache only — **no** `localStorage` app state |
| Design | Brand tokens + Fraunces/Outfit via `next/font`. Follow `design-system/embermaths12/MASTER.md`; page files under `design-system/embermaths12/pages/` override when present |
| Gold CTAs | Gold background, **navy** text for contrast |
| Assessments | Default pass mark **50%**. Past papers are practice-only and **do not** affect pass/fail |
| Lesson complete | If a day has a `lessonTest`, student must pass it before **Mark lesson complete** |

---

## 5. v1 requirements (as-built)

### 5.1 Auth & profile — `shipped`

| Requirement | Detail |
|-------------|--------|
| Role hubs | `/login`, `/signup` route into `/login/[role]` and `/signup/[role]` (student, teacher, parent). Admin has **login only** — no public `/signup/admin` |
| Login | Email/password; reject if `profiles.role` ≠ expected role; then hydrate app state |
| Signup | Name, email, password (min 6) for student/teacher/parent. Students **must** set province + municipality (SA geography). Admin accounts are created by an existing admin on `/admin/users` via `POST /api/auth/create-admin` |
| Admin lock | Migration `20260905102918`: `handle_new_user` assigns `admin` only when `app_metadata.role = admin`. Crafted `user_metadata.role = admin` on public signup becomes `student`. Trigger syncs resolved role into `app_metadata` |
| Session | Cookie refresh via `src/proxy.ts` + `@supabase/ssr` |
| Settings | Name, **read-only email**, optional password + confirm, profile image (`profiles.avatar_url`); light/dark theme on `profiles.theme`. Students edit location. Email cannot be changed after signup (UI + write path + DB trigger) |
| Parent–child | Schema: `profiles.parent_id`. Seed links demo student ↔ parent. **No** linking UI anywhere (`gap`) |

Seed demo accounts (password `ember12`): `admin@ember12.za`, `student@ember12.za`, `teacher@ember12.za`, `parent@ember12.za`. Seeded `admin@ember12.za` is for local/seed demos only — live-project admin verification credentials live in `.cursor/rules/ember12.mdc`.

### 5.2 Curriculum model — `shipped`

- Terms **1–4** shells always exist; **weeks and lesson content come only from admin uploads** on `/admin/terms` (stored in the Supabase `curriculum` row). Runtime does **not** inject placeholder CAPS weeks, mock MCQs, or YouTube fallbacks.
- Empty / missing DB curriculum → empty Term 1–4 shells (`weeks: []`); admin adds weeks and uploads materials
- Each week: Mon–Fri lessons (each may have a **lesson test**) + **Saturday week test**
- After the term’s weeks: **pre-exam** and **past paper**
- Resources: PDF, Markdown, link, worksheet; files in Storage bucket `lesson-files` (max **20 MB**)
- Lesson player **Video** tab:
  - Prefer a **hosted mp4** when Admin uploads one to `lesson-videos` (URL stored on `Lesson.videoUrl`)
  - Else PDF → slide deck at view time (`pdfjs-dist`) with browser TTS
  - **Text** tab = uploaded PDF page preview + downloads
  - **Markdown** is admin-only: used to mock-generate daily lesson-test MCQs; stripped from student/teacher/parent curriculum payloads (not shown in Text, Resources, or Video)
  - **Not** live streaming / live video hosting

### 5.3 Assessments — `shipped` + L2 `in-progress`

| Mode | Behavior | Status |
|------|----------|--------|
| On-screen MCQ | Score via `scoreMcq`; pass if `score >= passMark` | `shipped` |
| Paper + scan (Saturday week test) | Student uploads photo/PDF to private `student-scans`; server marks against admin memo with Gemini (`GEMINI_API_KEY`). Review/approve before mark. | `shipped` (L2 first slice) |
| Paper + scan (lesson / pre-exam / past paper) | Upload photo/PDF; still uses `mockPaperGrade` (filename hash, memo **title** only) until L2 expands | `mock` |
| Admin MCQ gen | As-built: saving daily lesson Markdown mock-generates ~5 MCQs; **Regenerate questions** (Markdown only — PDFs are materials, not question sources). **L2 now:** replace with live AI generation | `in-progress` |
| Memos | `memoResources` admin-only; not student downloads. Week-test L2 uses memo **file contents** as the mark scheme | `shipped` |

Used by: daily lesson tests, Saturday week tests, pre-exams. Past papers: paper+scan practice only (still **do not** affect pass/fail).

**L2 constraints (stay true while replacing mocks):**

- Grading and MCQ generation run **on the server** (API routes). Clients do not upsert `student_progress` or `corrections`.
- Default pass mark **50%**. Past papers remain practice-only.
- Memos stay admin-only; students never download them.
- Saturday week test paper path is real Gemini marking. Other paper-scan paths stay labelled mock until replaced.

### 5.4 Progress, badges, rankings — `shipped`

- **overallPercent** ≈ weighted mix of average test score and completed lessons (see `recomputeProgress` in `src/lib/domain/recompute-progress.ts`)
- **status:** `pending` \| `passing` (≥ 50%) \| `failing`
- **Badges:** First Spark, Week Warrior, Saturday Strong, Term Ready, Consistent Ember (earn logic in `recomputeProgress`; copy may not match code exactly — `gap`)
- **Top Achievers:** rank by `overallPercent`; filters province / municipality / teacher class scope
- **Term insights:** strengths, weak topics, suggested actions (`src/lib/term-insights.ts`)
- Progress and corrections write through assessment / complete-lesson **API routes** + security-definer RPCs — clients do not upsert those tables directly. Store hydrates curriculum via `GET /api/curriculum`

### 5.5 Admin portal — `shipped`

| Route | Capability |
|-------|------------|
| `/admin` | Dashboard stats, learner progress |
| `/admin/terms` | Upload/edit lessons, week tests, pre-exams, past papers; **add/remove weeks** (uncapped per term — empty Mon–Fri + Saturday test); regenerate MCQs; **upload lesson mp4** |
| `/admin/users` | List admins/teachers; **create admin** accounts; delete student/parent accounts |
| `/admin/groups` | Study groups, assign students, optional term link |
| `/admin/pass-fail` | Filter by passing / failing / pending |
| `/admin/achievers` | Leaderboard + geo filters |

### 5.6 Student portal — `shipped`

| Route | Capability |
|-------|------------|
| `/student` | Progress ring, term insights, continue learning |
| `/student/learn` … `/[termId]/[weekId]/[day]` | Term → week → lesson player + day test + mark complete |
| `/student/learn/[termId]/pre-exam` | Term pre-exam |
| `/student/past-papers` … | Practice loop (download / scan / feedback / share clipboard) — as-built mock grade; **L2** now |
| `/student/badges` | Earned vs locked |
| `/student/achievers` | National / provincial / municipal rankings |
| `/student/settings` | Profile, location, theme |

### 5.7 Teacher portal — `shipped` (with gaps)

| Route | Capability |
|-------|------------|
| `/teacher` | Dashboard |
| `/teacher/classes` | Create classes; search & add students; accept pending (pending join has **no** student UI — `gap`) |
| `/teacher/progress` | Per-class roster + term insights |
| `/teacher/achievers` | Class-scoped or geo rankings |
| `/teacher/lessons` | Create class-scoped lessons — **not** shown in student Learn (`gap`) |
| `/teacher/messages` | Message parents of class students |
| `/teacher/settings` | Profile, theme |

### 5.8 Parent portal — `shipped` (link `gap`)

| Route | Capability |
|-------|------------|
| `/parent` | Linked-child progress, badges, scores, insights, past-paper attempts, teacher messages |
| `/parent/settings` | Profile, theme |

Empty state when `childIds` is empty (no linking UI — parent copy may say “ask admin,” but `/admin` has no link UI either).

---

## 6. v1 out of scope (do not build)

| Item | Status |
|------|--------|
| Live / streaming video hosting | `later` — do not build; pre-rendered explainer mp4s are already `shipped` (see §5.2) |
| Email confirmation, password-reset email productization | `later` |
| Payments / subscriptions / school billing | `later` |

Agents **MUST NOT** implement these unless a task explicitly promotes them out of Later.

---

## 7. Known gaps (do not invent unless tasked)

| Gap | Current state |
|-----|----------------|
| Parent–child linking UI | Schema + seed/SQL only; no linking UI anywhere (parent empty state may mention admin, but `/admin` has no link UI) |
| Student join-class request | `requestJoinClass` in store; no student-facing UI; teachers enroll directly |
| Study groups for students | Admin-managed only; no student group experience |
| Teacher lessons in Learn | Persisted in `teacher_lessons` / app state; not integrated into student curriculum path |
| Badge description vs earn logic | Marketing copy may not match `src/lib/domain/recompute-progress.ts` thresholds |

Do **not** invent these features mid-task. Implement only when the user asks.

---

## 8. Later (v2+) — proposed, not committed

Edit this section as product priorities firm up. Cursor **MUST NOT** implement Later items unless a task says to.

| ID | Capability | Notes |
|----|------------|-------|
| L1 | Pre-rendered hosted lesson video | **Shipped** (see §5.2) — admin uploads mp4 to `lesson-videos`; Video tab prefers hosted mp4; PDF slideshow fallback. Live streaming still later |
| L2 | Real OCR / AI grading | **In progress** — Saturday week-test scan marked against admin memo with Gemini (`shipped`). Replace remaining `mockPaperGrade` paths and mock MCQ generation next |
| L3 | Email confirmation & transactional email | Signup confirm, resets |
| L4 | Payments / billing | Subscriptions or school billing |
| L5 | Parent–child self-service linking | Close gap in §7 |
| L6 | Student class join / invite UX | Close gap in §7 |
| L7 | Student-facing study groups | Close gap in §7 |
| L8 | Teacher lessons in student Learn | Close gap in §7 |
| L9 | Richer parent–teacher notifications | Beyond in-app messages |
| L10 | Deeper CAPS / school analytics | Beyond current term insights |

---

## 9. Success criteria & demo

| Criterion | Expectation |
|-----------|-------------|
| Demo login | Four roles with password `ember12` after optional local TS seed (demo users only) |
| Curriculum | Live content is the Supabase `curriculum` row (admin uploads). Seed scripts must **not** overwrite existing `terms`. Empty DBs get Term 1–4 shells only |
| Pass mark | Default **50%** for lesson / week / pre-exam assessments |
| Rankings | By `overallPercent`; SA province/municipality filters |
| Data path | Mutations write through Supabase; store hydrates on boot (curriculum via `GET /api/curriculum`) |
| L2 grading | Saturday week-test paper+scan marks the uploaded script against the memo on the server (Gemini). Other paper-scan paths stay mock until replaced |

### Key implementation references

| Area | Path |
|------|------|
| Types | `src/lib/types.ts` |
| Store | `src/lib/store.tsx` |
| Domain helpers | `src/lib/domain/` (incl. `recompute-progress.ts`) |
| App state I/O | `src/lib/supabase/app-state.ts` (curriculum hydrate via `GET /api/curriculum`) |
| API auth gate | `src/lib/supabase/require-user.ts` |
| Progress / corrections (server) | `src/lib/supabase/progress-server.ts` |
| Auth client | `src/lib/auth-client.ts` |
| Rankings / geography | `src/lib/rankings.ts`, `src/lib/sa-geography.ts` |
| Paper-scan / MCQ gen (L2) | `src/lib/grade-week-test-scan.ts` (week tests), `src/lib/mock-paper-grade.ts` (other paths), `src/lib/generate-lesson-mcqs.ts`, `src/app/api/assessments/paper-scan/route.ts` |
| Design | `design-system/embermaths12/MASTER.md` |
| Overview | `README.md` |
