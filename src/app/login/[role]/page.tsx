"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { isRole, roleLabel } from "@/lib/roles";
import { useStore } from "@/lib/store";

function LoginForm() {
  const { login } = useStore();
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const roleParam = params.role;
  const role = isRole(roleParam) ? roleParam : null;

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!role) router.replace("/login");
  }, [role, router]);

  if (!role) {
    return <p className="text-sm text-muted">Redirecting…</p>;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role || loading) return;
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, role);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/${result.role}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-ember-white p-8 shadow-sm">
      <h1 className="font-display text-3xl text-ember-navy">{roleLabel(role)} log in</h1>
      <p className="mt-2 text-sm text-muted">Access your Ember Maths12 {role} portal.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-md bg-ember-navy py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-ember-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        No account?{" "}
        <Link
          href={`/signup/${role}`}
          className="font-semibold text-ember-navy underline decoration-ember-gold"
        >
          Sign up as {roleLabel(role).toLowerCase()}
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted">
        <Link href="/login" className="font-semibold text-ember-navy underline decoration-ember-gold">
          Choose a different portal
        </Link>
      </p>
    </div>
  );
}

export default function RoleLoginPage() {
  return (
    <div className="ember-wash flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl text-ember-navy">
        Ember Maths<span className="text-ember-gold">12</span>
      </Link>
      <Suspense fallback={<p>Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
