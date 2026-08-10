"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { DEMO_PASSWORD } from "@/lib/mock/seed";

const demos: { role: Role; email: string }[] = [
  { role: "admin", email: "admin@ember12.za" },
  { role: "student", email: "student@ember12.za" },
  { role: "teacher", email: "teacher@ember12.za" },
  { role: "parent", email: "parent@ember12.za" },
];

function LoginForm() {
  const { login } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/${result.role}`);
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-ember-white p-8 shadow-sm">
      <h1 className="font-display text-3xl text-ember-navy">Log in</h1>
      <p className="mt-2 text-sm text-muted">Access your Ember12 portal.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          className="w-full rounded-md bg-ember-navy py-2.5 text-sm font-semibold text-white hover:bg-ember-black"
        >
          Log in
        </button>
      </form>
      <div className="mt-6 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">Demo accounts</p>
        {demos.map((d) => (
          <button
            key={d.email}
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:border-ember-gold"
            onClick={() => {
              setEmail(d.email);
              setPassword(DEMO_PASSWORD);
            }}
          >
            <span className="capitalize">{d.role}</span>
            <span className="text-muted">{d.email}</span>
          </button>
        ))}
        <p className="text-xs text-muted">Password for all demos: {DEMO_PASSWORD}</p>
      </div>
      <p className="mt-6 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-ember-navy underline decoration-ember-gold">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="ember-wash flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl text-ember-navy">
        Ember<span className="text-ember-gold">12</span>
      </Link>
      <Suspense fallback={<p>Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
