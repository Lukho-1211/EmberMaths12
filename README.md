# EmberMaths12

Online South African **CAPS Grade 12 Mathematics** school frontend — Udemy-style learning with Admin, Student, Teacher, and Parent portals.

Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. Auth and data are **mocked in the browser** (`localStorage`) so you can demo the full product on Vercel without a backend.

## Brand

Palette from `resourceInfo/colors.jpg` (Black & Gold Elegance):

| Token | Hex |
|-------|-----|
| White | `#FFFFFF` |
| Light gray | `#E5E5E5` |
| Gold | `#FCA311` |
| Navy | `#14213D` |
| Black | `#000000` |

## Demo accounts

Password for all demos: **`ember12`**

| Role | Email |
|------|-------|
| Admin | `admin@ember12.za` |
| Student | `student@ember12.za` |
| Teacher | `teacher@ember12.za` |
| Parent | `parent@ember12.za` |

## Curriculum model (v1)

- Terms **1–4** (placeholder CAPS topics from the 2025 ATP)
- Each term: **Weeks 1–4** → Mon–Fri lessons (each with a **lesson test**) + **Saturday week test**
- After Week 4: **Pre-exam**

## Features

### Admin → Terms

Upload **PDF** or **Markdown** (`.md`) files for:

- Daily **lessons** (Mon–Fri)
- **Saturday week tests** (exam paper + marking **memo**)
- **Pre-exams** (exam paper + marking **memo**)

Saving a daily lesson with uploaded PDF/Markdown **mock-generates MCQ questions** from the document text (deterministic demo generation, not a live AI API). Admins can also **Regenerate questions** from the current materials.

Exam papers are shown to students (walkthrough + download). Memos are admin-only and used when correcting paper+scan uploads.

Files are stored as data URLs in `localStorage` (max **20 MB** per file). Admins can remove attachments and edit titles in place.

### Student → Learn

Each lesson has **Video** and **Text** tabs:

- **Video** — uploaded PDF/Markdown is converted at view time into a slide deck (`pdfjs-dist` for PDFs). Students get play/pause, prev/next, keyboard shortcuts, and fullscreen.
- **Text** — inline Markdown preview plus download links for PDFs and worksheets.

Each Mon–Fri lesson also includes a **required lesson test** (on-screen MCQ or paper + scan). Students must **pass** the day test before **Mark lesson complete** is enabled.

Week tests and pre-exams show attached exam papers the same way (walkthrough player + download/preview).

### Assessments

Daily lesson tests, Saturday week tests, and pre-exams support two modes:

1. **On-screen MCQ** — answer in the browser; score against the pass mark.
2. **Paper + scan** — read the questions, work on paper, upload a photo/PDF of your script, then receive a **mock mark and per-question feedback** (deterministic demo grading, not real OCR).

General **Scan & feedback** (`/student/scan`) is also available for ad-hoc script uploads.

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
