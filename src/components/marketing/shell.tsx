import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Services" },
  { href: "/#vision", label: "Vision" },
  { href: "/#mission", label: "Mission" },
  { href: "/#contact", label: "Contact" },
];

export function MarketingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight text-ember-white">
          Ember<span className="text-ember-gold">12</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ember-gray md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="transition hover:text-ember-gold">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-ember-white transition hover:text-ember-gold"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-ember-gold px-4 py-2 text-sm font-semibold text-ember-navy transition hover:brightness-105"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-ember-black text-ember-gray">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <p className="font-display text-xl text-ember-white">
          Ember<span className="text-ember-gold">12</span>
        </p>
        <p className="text-sm">CAPS Grade 12 Mathematics · South Africa</p>
        <p className="text-sm">© {new Date().getFullYear()} Ember12</p>
      </div>
    </footer>
  );
}

export function Section({
  id,
  eyebrow,
  title,
  children,
  dark,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      className={`px-6 py-20 ${dark ? "bg-ember-navy text-ember-white" : "bg-ember-white text-ember-navy"}`}
    >
      <div className="mx-auto max-w-6xl">
        {eyebrow ? (
          <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${dark ? "text-ember-gold" : "text-ember-navy/60"}`}>
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
        <div className={`mt-6 max-w-3xl text-base leading-relaxed ${dark ? "text-ember-gray" : "text-muted"}`}>
          {children}
        </div>
      </div>
    </section>
  );
}
