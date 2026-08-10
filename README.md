# Ember12

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
- Each term: **Weeks 1–4** → Mon–Fri lessons + **Saturday week test**
- After Week 4: **Pre-exam**

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
