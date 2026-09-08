import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  ScanLine,
  School,
  Users,
} from "lucide-react";
import {
  MarketingFooter,
  MarketingNav,
  Section,
} from "@/components/marketing/shell";

const roleCards = [
  {
    role: "Student",
    href: "/signup/student",
    blurb: "Learn Mon–Fri lessons, Saturday week tests, and term pre-exams.",
    cta: "Sign up →",
  },
  {
    role: "Teacher",
    href: "/signup/teacher",
    blurb: "Build classes, publish lessons, and message parents.",
    cta: "Sign up →",
  },
  {
    role: "Parent",
    href: "/signup/parent",
    blurb: "Track your child’s progress, badges, and pass/fail status.",
    cta: "Sign up →",
  },
  {
    role: "Admin",
    href: "/login/admin",
    blurb: "Shape terms, weeks, teachers, groups, and school-wide insight.",
    cta: "Log in →",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "Slide lessons from PDF or hosted video",
    body: "Uploaded lesson PDFs become a playable slide deck at view time — play, pause, prev/next, keyboard shortcuts, and fullscreen. Admins can also upload an MP4.",
  },
  {
    icon: FileText,
    title: "Text tab with downloads",
    body: "Read PDF page previews and download worksheets alongside every lesson.",
  },
  {
    icon: ClipboardCheck,
    title: "Saturday tests and pre-exams",
    body: "On-screen MCQ against a pass mark, or paper-plus-scan — Saturday week tests mark against the admin memo.",
  },
  {
    icon: ScanLine,
    title: "Scan and feedback",
    body: "Upload a script photo or PDF. Saturday week tests are marked for real against the memo; other scans still use demo grading.",
  },
  {
    icon: School,
    title: "Teacher classrooms",
    body: "Create classes, accept students, publish lessons, and message parents from one place.",
  },
  {
    icon: Users,
    title: "Parent and admin visibility",
    body: "Parents see progress and badges; admins manage terms, groups, and pass/fail risk early.",
  },
];

function CapsRhythmDiagram() {
  return (
    <div
      className="relative w-full max-w-xl select-none"
      aria-hidden="true"
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(252,163,17,0.22),transparent_65%)]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-ember-black/40 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-sm md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ember-gold">
          CAPS year map
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {["Term 1", "Term 2", "Term 3", "Term 4"].map((term, i) => (
            <div
              key={term}
              className="animate-rise-stagger rounded-xl border border-white/10 bg-ember-navy/80 px-3 py-3"
              style={{ animationDelay: `${0.08 + i * 0.06}s` }}
            >
              <p className="font-display text-lg text-ember-white">{term}</p>
              <p className="mt-1 text-[11px] leading-snug text-ember-gray">Weekly lessons</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-xs text-ember-gray">
          <span className="rounded-md bg-white/10 px-2.5 py-1.5 text-ember-white">Mon–Fri lessons</span>
          <span className="text-ember-gold/80">→</span>
          <span className="rounded-md bg-ember-gold/20 px-2.5 py-1.5 font-semibold text-ember-gold">
            Saturday week test
          </span>
          <span className="text-ember-gold/80">→</span>
          <span className="rounded-md border border-ember-gold/40 px-2.5 py-1.5 text-ember-white">
            Pre-exam
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <main id="main">
        <section className="relative min-h-[100svh] overflow-hidden bg-ember-navy text-ember-white">
          <Image
            src="/images/hero-grade12-maths.jpg"
            alt="Grade 12 learners studying mathematics together"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-ember-navy/80" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,33,61,0.92)_0%,rgba(20,33,61,0.55)_55%,rgba(20,33,61,0.72)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(252,163,17,0.28),transparent_48%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.5)_100%)]" />

          <div className="relative mx-auto grid min-h-[100svh] max-w-6xl items-end gap-12 px-6 pb-16 pt-28 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-24 md:pt-24">
            <div>
              <p className="animate-rise text-sm font-semibold uppercase tracking-[0.25em] text-ember-gold">
                South African CAPS · Grade 12 Mathematics
              </p>
              <h1 className="animate-rise-delay mt-4 font-display text-5xl leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                Ember Maths<span className="text-ember-gold">12</span>
              </h1>
              <p className="animate-rise-delay mt-6 max-w-xl text-lg text-ember-gray md:text-xl">
                An online school for Grade 12 Maths — structured terms, weekday lessons, and Saturday
                assessments that keep learners, teachers, and parents aligned.
              </p>
              <div className="animate-rise-delay mt-10 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="animate-glow inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-ember-gold px-6 py-3 text-sm font-bold text-ember-navy transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
                >
                  Start learning
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-ember-white transition duration-200 hover:border-ember-gold hover:text-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
                >
                  Log in
                </Link>
              </div>
            </div>

            <div className="animate-rise-delay pb-4 md:justify-self-end md:pb-0">
              <CapsRhythmDiagram />
            </div>
          </div>
        </section>

        <section id="about" className="bg-ember-white px-6 py-20 text-ember-navy md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ember-navy/60">
              How it works
            </p>

            <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-12">
              <div className="max-w-xl space-y-4">
                <h2 className="font-display text-3xl md:text-4xl">
                  Built around the CAPS classroom rhythm
                </h2>
                <p className="text-base leading-relaxed text-muted">
                  Ember Maths12 mirrors the way South African Grade 12 Mathematics is taught throughout
                  the academic year, following a structured Term 1 to Term 4 programme. Learners
                  progress through weekday lessons designed to build their understanding step by step,
                  with Saturday week tests providing regular opportunities to assess their progress.
                </p>
                <p className="text-base leading-relaxed text-muted">
                  Every four-week learning block concludes with a pre-exam, helping learners prepare
                  for formal assessments and identify areas that need improvement. The platform also
                  provides curated learning content and downloadable resources, while keeping teachers
                  and parents informed about each learner&apos;s progress and development.
                </p>
              </div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(20,33,61,0.16)]">
                <Image
                  src="/images/about-caps-rhythm.jpg"
                  alt="Grade 12 learner studying mathematics with notes, calculator, and a digital lesson"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 480px"
                  priority={false}
                />
              </div>
            </div>

            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { step: "01", label: "Terms 1–4", detail: "Placeholder CAPS topics from the Annual Teaching Plan." },
                { step: "02", label: "Weekly lessons", detail: "Each week holds Mon–Fri lessons in sequence." },
                { step: "03", label: "Saturday test", detail: "Weekly accountability after every lesson block." },
                { step: "04", label: "Pre-exam", detail: "Term checkpoint with paper walkthrough and memo support." },
              ].map((item, i) => (
                <li
                  key={item.step}
                  className="animate-reveal border-t border-ember-navy/15 pt-4"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <p className="text-xs font-semibold tracking-[0.18em] text-ember-gold">{item.step}</p>
                  <p className="mt-2 font-display text-xl text-ember-navy">{item.label}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" className="bg-ember-white px-6 py-20 text-ember-navy md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ember-navy/60">
              Features
            </p>
            <h2 className="font-display text-3xl md:text-4xl">What Ember Maths12 offers</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
              Udemy-style learning for CAPS Maths — with Admin, Student, Teacher, and Parent portals
              mocked in the browser so you can demo the full product.
            </p>
            <ul className="mt-12 grid gap-8 md:grid-cols-2">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <li
                    key={feature.title}
                    className="group flex gap-4 rounded-xl border border-border bg-ember-white p-5 shadow-[0_1px_2px_rgba(20,33,61,0.06)] transition duration-200 hover:border-ember-gold hover:shadow-[0_4px_12px_rgba(20,33,61,0.08)]"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ember-gold/40 bg-ember-gold/10 text-ember-navy">
                      <Icon size={22} strokeWidth={1.75} aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-xl text-ember-navy">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="roles" className="ember-wash px-6 py-20 md:py-24">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-navy/60">
              Join as
            </p>
            <h2 className="mt-3 font-display text-3xl text-ember-navy md:text-4xl">
              Student, teacher, parent, or admin
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              Pick the portal that matches how you show up for Grade 12 Maths.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {roleCards.map((card) => (
                <Link
                  key={card.role}
                  href={card.href}
                  className="group cursor-pointer rounded-xl border border-border bg-ember-white p-5 shadow-[0_1px_2px_rgba(20,33,61,0.06)] transition duration-200 hover:border-ember-gold hover:shadow-[0_4px_12px_rgba(20,33,61,0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
                >
                  <h3 className="font-display text-2xl text-ember-navy transition duration-200 group-hover:text-ember-gold">
                    {card.role}
                  </h3>
                  <p className="mt-3 text-sm text-muted">{card.blurb}</p>
                  <span className="mt-4 inline-block text-sm font-semibold text-ember-navy">
                    {card.cta}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Section
          id="mission"
          eyebrow="Mission"
          title="Make CAPS Maths continuous, visible, and actionable"
          dark
        >
          <p>
            Ember Maths12 turns the Annual Teaching Plan into a living online school: daily lessons,
            weekly checks, term pre-exams, and dashboards that help admins, teachers, students, and
            parents act early when a learner is at risk of failing. A learner in Johannesburg and a
            tutor in Cape Town share the same weekly map — families see progress without waiting for
            the next report card.
          </p>
        </Section>

        <Section id="contact" eyebrow="Contact" title="Talk to Ember Maths12">
          <div className="space-y-2 text-ember-navy">
            <p>
              Email:{" "}
              <a
                className="cursor-pointer font-semibold underline decoration-ember-gold underline-offset-2 transition duration-200 hover:text-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
                href="mailto:hello@ember12.za"
              >
                hello@ember12.za
              </a>
            </p>
            <p>Phone: +27 11 555 1212</p>
            <p>Address: Digital campus · Serving CAPS schools across South Africa</p>
          </div>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-ember-gold px-6 py-3 text-sm font-bold text-ember-navy transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
            >
              Start learning free
            </Link>
          </div>
        </Section>
      </main>

      <MarketingFooter />
    </div>
  );
}
