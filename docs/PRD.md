# Ember Maths12 — Product Requirements Document

**Status:** v1 as-built + proposed later  
**Audience:** Cursor agents and humans implementing product work  
**Stack conventions:** see [`.cursor/rules/ember12.mdc`](../.cursor/rules/ember12.mdc). **As-built stack (versions and files):** [`tech_stack.md`](tech_stack.md).

Status tags used below: `shipped` | `mock` | `gap` | `later`

---

## 1. How Cursor uses this file

Treat this document as **product law** for Ember Maths12.

- **MUST** read this file before product, UX, routing, or feature work.
- **MUST NOT** add portals, roles, payments, live video hosting, email confirmation, or real OCR/AI grading unless a task explicitly moves an item from **Later** → **Now**.
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

Public entry: `/` (landing), `/login` → `/login/[role]`, `/signup` → `/signup/[role]`.

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
| Curriculum shape | Terms 1–4 → Weeks 1–4 (Mon–Fri lessons + Saturday week test) → pre-exam + past paper |
| Authorization | Role **always** from `public.profiles`, never editable `user_metadata` |
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
| Role hubs | `/login`, `/signup` route into `/login/[role]` and `/signup/[role]` |
| Login | Email/password; reject if `profiles.role` ≠ expected role; then hydrate app state |
| Signup | Name, email, password (min 6). Students **must** set province + municipality (SA geography) |
| Session | Cookie refresh via `src/proxy.ts` + `@supabase/ssr` |
| Settings | Name, email, optional password; light/dark theme on `profiles.theme`. Students edit location |
| Parent–child | Schema: `profiles.parent_id`. Seed links demo student ↔ parent. **No** self-service link UI (`gap`) |

Demo accounts (password `ember12`): `admin@ember12.za`, `student@ember12.za`, `teacher@ember12.za`, `parent@ember12.za`.

### 5.2 Curriculum model — `shipped`

- Terms **1–4** (placeholder CAPS topics from 2025 ATP in `resourceInfo/`)
- Each week: Mon–Fri lessons (each may have a **lesson test**) + **Saturday week test**
- After Week 4: **pre-exam** and **past paper**
- Resources: PDF, Markdown, link, worksheet; files in Storage bucket `lesson-files` (max **20 MB**)
- Lesson player: **Video** tab = PDF/Markdown → slide deck at view time (`pdfjs-dist`); **Text** tab = uploaded Markdown preview and/or PDF page preview + downloads. Seed may include YouTube fallback URLs — **not** live hosted video

### 5.3 Assessments — `shipped` + `mock`

| Mode | Behavior | Status |
|------|----------|--------|
| On-screen MCQ | Score via `scoreMcq`; pass if `score >= passMark` | `shipped` |
| Paper + scan | Upload photo/PDF; `mockPaperGrade` returns deterministic mark + per-question feedback | `mock` — **not** real OCR |
| Admin MCQ gen | Saving daily lesson with extractable PDF/Markdown mock-generates ~5 MCQs; **Regenerate questions** | `mock` — **not** live AI |
| Memos | `memoResources` admin-only; used for mock paper feedback; not student downloads | `shipped` |

Used by: daily lesson tests, Saturday week tests, pre-exams. Past papers: paper+scan practice only.

### 5.4 Progress, badges, rankings — `shipped`

- **overallPercent** ≈ weighted mix of average test score and completed lessons (see `recomputeProgress` in `src/lib/store.tsx`)
- **status:** `pending` \| `passing` (≥ 50%) \| `failing`
- **Badges:** First Spark, Week Warrior, Saturday Strong, Term Ready, Consistent Ember (earn logic in store; copy may not match code exactly — `gap`)
- **Top Achievers:** rank by `overallPercent`; filters province / municipality / teacher class scope
- **Term insights:** strengths, weak topics, suggested actions (`src/lib/term-insights.ts`)

### 5.5 Admin portal — `shipped`

| Route | Capability |
|-------|------------|
| `/admin` | Dashboard stats, learner progress |
| `/admin/terms` | Upload/edit lessons, week tests, pre-exams, past papers; regenerate MCQs |
| `/admin/users` | List teachers; delete student/parent accounts |
| `/admin/groups` | Study groups, assign students, optional term link |
| `/admin/pass-fail` | Filter by passing / failing / pending |
| `/admin/achievers` | Leaderboard + geo filters |

### 5.6 Student portal — `shipped`

| Route | Capability |
|-------|------------|
| `/student` | Progress ring, term insights, continue learning |
| `/student/learn` … `/[termId]/[weekId]/[day]` | Term → week → lesson player + day test + mark complete |
| `/student/learn/[termId]/pre-exam` | Term pre-exam |
| `/student/past-papers` … | Practice loop (download / walkthrough / scan / mock feedback / share clipboard) |
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

Empty state when `childIds` is empty (no self-service linking).

---

## 6. v1 out of scope (do not build)

| Item | Status |
|------|--------|
| Live / hosted video lessons as primary Video tab | `later` — do not build in v1 |
| Real OCR / AI marking of paper+scan scripts | `later` — keep deterministic mocks |
| Email confirmation, password-reset email productization | `later` |
| Payments / subscriptions / school billing | `later` |

Agents **MUST NOT** implement these unless a task explicitly promotes them out of Later.

---

## 7. Known gaps (do not invent unless tasked)

| Gap | Current state |
|-----|----------------|
| Parent–child linking UI | Schema + seed only; no signup/admin self-service flow |
| Student join-class request | `requestJoinClass` in store; no student-facing UI; teachers enroll directly |
| Study groups for students | Admin-managed only; no student group experience |
| Teacher lessons in Learn | Persisted in `teacher_lessons` / app state; not integrated into student curriculum path |
| Badge description vs earn logic | Marketing copy may not match `recomputeProgress` thresholds |

Do **not** invent these features mid-task. Implement only when the user asks.

---

## 8. Later (v2+) — proposed, not committed

Edit this section as product priorities firm up. Cursor **MUST NOT** implement Later items unless a task says to.

| ID | Capability | Notes |
|----|------------|-------|
| L1 | Live / hosted video | Replace PDF slide-deck as primary Video experience |
| L2 | Real OCR / AI grading | Replace `mockPaperGrade` / mock MCQ generation |
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
| Demo login | Four roles with password `ember12` after SQL + TS seed |
| Curriculum seed | `write-curriculum-seed.ts` → `seed-app-state.sql` → curriculum row |
| Pass mark | Default **50%** for lesson / week / pre-exam assessments |
| Rankings | By `overallPercent`; SA province/municipality filters |
| Data path | Mutations write through Supabase; store hydrates on boot |
| Mocks labeled | Paper+scan and MCQ generation remain clearly demo/mock in UI and code |

### Key implementation references

| Area | Path |
|------|------|
| Types | `src/lib/types.ts` |
| Store | `src/lib/store.tsx` |
| App state I/O | `src/lib/supabase/app-state.ts` |
| Auth client | `src/lib/auth-client.ts` |
| Rankings / geography | `src/lib/rankings.ts`, `src/lib/sa-geography.ts` |
| Mock grading / MCQs | `src/lib/mock-paper-grade.ts`, `src/lib/generate-lesson-mcqs.ts` |
| Design | `design-system/embermaths12/MASTER.md` |
| Overview | `README.md` |
