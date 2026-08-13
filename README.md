# EmberMaths12

Online South African **CAPS Grade 12 Mathematics** school frontend — Udemy-style learning with Admin, Student, Teacher, and Parent portals.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS 4**. Auth and data are **mocked in the browser** (`localStorage`) so you can demo the full product on Vercel without a backend.

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

## Demo accounts

Password for all demos: `ember12`

| Role    | Email                |
| ------- | -------------------- |
| Admin   | `admin@ember12.za`   |
| Student | `student@ember12.za` |
| Teacher | `teacher@ember12.za` |
| Parent  | `parent@ember12.za`  |

Login and signup use role hubs (`/login`, `/signup`) that route into `/login/[role]` and `/signup/[role]`.

## Curriculum model (v1)

- Terms **1–4** (placeholder CAPS topics from the 2025 ATP in `resourceInfo/`)
- Each term: **Weeks 1–4** → Mon–Fri lessons (each with a **lesson test**) + **Saturday week test**
- After Week 4: **Pre-exam**

## Features

### Auth & profile

- Role-specific login and signup flows
- **Settings** (student / teacher / parent): name, email, password; students also set **province** and **municipality** for rankings
- Light / dark **theme** preference (stored with mock profile data)

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

Files are stored as data URLs in `localStorage` (max **20 MB** per file). Admins can remove attachments and edit titles in place.

### Student

| Area | What it does |
| ---- | ------------ |
| **Learn** | Term → week → day lessons with Video / Text tabs; required day tests; week tests & pre-exams |
| **Past papers** | Practice loop separate from pass/fail (download, scan script, mock feedback) |
| **Badges** | Milestone badges earned from progress |
| **Top Achievers** | Geographic rankings board |
| **Scan & Correct** | Ad-hoc worksheet photo/PDF upload with mock feedback |
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

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js** (defaults are fine).
4. Deploy.

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

## Out of scope (frontend v1)

Real auth/database, live video hosting, real OCR/AI correction API, email, and payments. Those UIs are wired with mock behaviour ready for later APIs.
