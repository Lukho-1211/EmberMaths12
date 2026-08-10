import Link from "next/link";
import { MarketingFooter, MarketingNav, Section } from "@/components/marketing/shell";

const roleCards = [
  {
    role: "Student",
    href: "/signup?role=student",
    blurb: "Learn Mon–Fri lessons, Saturday week tests, and term pre-exams.",
  },
  {
    role: "Teacher",
    href: "/signup?role=teacher",
    blurb: "Build classes, publish lessons, and message parents.",
  },
  {
    role: "Parent",
    href: "/signup?role=parent",
    blurb: "Track your child’s progress, badges, and pass/fail status.",
  },
  {
    role: "Admin",
    href: "/signup?role=admin",
    blurb: "Shape terms, weeks, teachers, groups, and school-wide insight.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />

      <section className="relative min-h-[100svh] overflow-hidden bg-ember-navy text-ember-white">
        <div className="ember-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(252,163,17,0.35),transparent_45%)]" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-20 pt-32 md:justify-center md:pb-24">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.25em] text-ember-gold">
            South African CAPS · Grade 12 Mathematics
          </p>
          <h1 className="animate-rise-delay mt-4 font-display text-6xl leading-[0.95] tracking-tight md:text-8xl">
            Ember<span className="text-ember-gold">12</span>
          </h1>
          <p className="animate-rise-delay mt-6 max-w-xl text-lg text-ember-gray md:text-xl">
            An online school for Grade 12 Maths — structured terms, weekly lessons, and Saturday
            assessments that keep learners, teachers, and parents aligned.
          </p>
          <div className="animate-rise-delay mt-10 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="animate-glow rounded-md bg-ember-gold px-6 py-3 text-sm font-bold text-ember-navy"
            >
              Start learning
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-ember-white transition hover:border-ember-gold hover:text-ember-gold"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <Section id="about" eyebrow="About" title="Built around the CAPS classroom rhythm">
        <p>
          Ember12 mirrors how South African Grade 12 Mathematics is taught across the year: Term 1
          to Term 4, weekday lessons, Saturday week tests, and a pre-exam after each four-week
          block. Learners move through curated content with downloadable resources — teachers and
          parents stay in the loop.
        </p>
      </Section>

      <Section id="services" eyebrow="Services" title="What Ember12 offers" dark>
        <ul className="grid gap-6 md:grid-cols-2">
          <li>
            <strong className="block text-ember-gold">Structured learning path</strong>
            Mon–Fri video lessons with notes, worksheets, and “learn more” links.
          </li>
          <li>
            <strong className="block text-ember-gold">Weekly accountability</strong>
            Saturday tests after every week, then a term pre-exam.
          </li>
          <li>
            <strong className="block text-ember-gold">Teacher classrooms</strong>
            Create classes, accept students, publish lessons, message parents.
          </li>
          <li>
            <strong className="block text-ember-gold">AI scan corrections</strong>
            Learners upload a page photo for mock AI feedback and shareable results.
          </li>
        </ul>
      </Section>

      <Section id="vision" eyebrow="Vision" title="Every Grade 12 learner finishes Maths with clarity">
        <p>
          We envision a digital campus where CAPS content is never fragmented — where a learner in
          Johannesburg and a tutor in Cape Town share the same weekly map, and families can see
          progress without waiting for the next report card.
        </p>
      </Section>

      <Section id="mission" eyebrow="Mission" title="Make CAPS Maths continuous, visible, and actionable" dark>
        <p>
          Ember12’s mission is to turn the Annual Teaching Plan into a living online school:
          daily lessons, weekly checks, term pre-exams, and dashboards that help admins, teachers,
          students, and parents act early when a learner is at risk of failing.
        </p>
      </Section>

      <section id="roles" className="ember-wash px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember-navy/60">
            Join as
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">Student, teacher, parent, or admin</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roleCards.map((card) => (
              <Link
                key={card.role}
                href={card.href}
                className="group border border-border bg-ember-white p-5 transition hover:border-ember-gold"
              >
                <h3 className="font-display text-2xl text-ember-navy group-hover:text-ember-gold">
                  {card.role}
                </h3>
                <p className="mt-3 text-sm text-muted">{card.blurb}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-ember-navy">
                  Sign up →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section id="contact" eyebrow="Contact" title="Talk to Ember12">
        <div className="space-y-2">
          <p>
            Email:{" "}
            <a className="font-semibold text-ember-navy underline decoration-ember-gold" href="mailto:hello@ember12.za">
              hello@ember12.za
            </a>
          </p>
          <p>Phone: +27 11 555 1212</p>
          <p>Address: Digital campus · Serving CAPS schools across South Africa</p>
          <p className="pt-4 text-sm">
            Demo logins use password <code className="rounded bg-ember-gray px-1.5 py-0.5">ember12</code>{" "}
            — see the README after deploy.
          </p>
        </div>
      </Section>

      <MarketingFooter />
    </div>
  );
}
