"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const links = [
  { href: "/#about", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#roles", label: "Join" },
  { href: "/#contact", label: "Contact" },
];

export function BrandMark({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const base = tone === "dark" ? "text-ember-navy" : "text-ember-white";
  return (
    <span className={`font-display tracking-tight ${base} ${className}`}>
      EmberMaths<span className="text-ember-gold">12</span>
    </span>
  );
}

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-[background-color,box-shadow] duration-200 ${
        scrolled || open
          ? "bg-ember-navy/95 shadow-[0_4px_24px_rgba(0,0,0,0.25)] backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-ember-gold focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-ember-navy"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="cursor-pointer rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-gold"
          onClick={() => setOpen(false)}
        >
          <BrandMark className="text-2xl" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ember-gray md:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="cursor-pointer transition duration-200 hover:text-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-gold"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-ember-white transition duration-200 hover:text-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-ember-gold px-4 py-2 text-sm font-semibold text-ember-navy transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-ember-white transition duration-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-white/10 bg-ember-navy px-6 py-4 md:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="cursor-pointer rounded-lg px-3 py-3 text-base text-ember-gray transition duration-200 hover:bg-white/5 hover:text-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            <Link
              href="/login"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-ember-white transition duration-200 hover:border-ember-gold hover:text-ember-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
              onClick={() => setOpen(false)}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
              onClick={() => setOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-ember-black text-ember-gray">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <BrandMark className="text-xl" />
        <p className="text-sm">CAPS Grade 12 Mathematics · South Africa</p>
        <p className="text-sm">© {new Date().getFullYear()} EmberMaths12</p>
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
  className = "",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`px-6 py-20 md:py-24 ${
        dark ? "bg-ember-navy text-ember-white" : "bg-ember-white text-ember-navy"
      } ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        {eyebrow ? (
          <p
            className={`mb-3 text-xs font-semibold uppercase tracking-[0.2em] ${
              dark ? "text-ember-gold" : "text-ember-navy/60"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
        <div
          className={`mt-6 max-w-3xl text-base leading-relaxed ${
            dark ? "text-ember-gray" : "text-muted"
          }`}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
