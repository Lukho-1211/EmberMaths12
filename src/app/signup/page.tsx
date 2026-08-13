"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { MunicipalityAutocomplete } from "@/components/municipality-autocomplete";
import { isValidMunicipality, SA_PROVINCES } from "@/lib/sa-geography";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const roles: Role[] = ["student", "teacher", "parent", "admin"];

const fieldClass =
  "w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40";

function SignupForm() {
  const { signup } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role) || "student";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(roles.includes(initialRole) ? initialRole : "student");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (role === "student") {
      if (!province || !municipality) {
        setError("Province and municipality are required for students.");
        return;
      }
      if (!isValidMunicipality(province, municipality)) {
        setError("Please select a valid municipality for the chosen province.");
        return;
      }
    }
    const result = signup({
      name,
      email,
      password,
      role,
      province: role === "student" ? province : undefined,
      municipality: role === "student" ? municipality : undefined,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/${role}`);
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-ember-white p-8 shadow-sm">
      <h1 className="font-display text-3xl text-ember-navy">Sign up</h1>
      <p className="mt-2 text-sm text-muted">Create your EmberMaths12 account.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            className={fieldClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            className={fieldClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">I am a…</span>
          <select
            className={fieldClass}
            value={role}
            onChange={(e) => {
              const next = e.target.value as Role;
              setRole(next);
              if (next !== "student") {
                setProvince("");
                setMunicipality("");
              }
            }}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </label>
        {role === "student" ? (
          <>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Province</span>
              <select
                className={fieldClass}
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value);
                  setMunicipality("");
                }}
                required
              >
                <option value="">Select province…</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Municipality</span>
              <MunicipalityAutocomplete
                province={province}
                value={municipality}
                onChange={setMunicipality}
                required
              />
            </label>
          </>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          className="w-full cursor-pointer rounded-md bg-ember-gold py-2.5 text-sm font-bold text-ember-navy transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
        >
          Create account
        </button>
      </form>
      <p className="mt-6 text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-ember-navy underline decoration-ember-gold">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="ember-wash flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl text-ember-navy">
        EmberMaths<span className="text-ember-gold">12</span>
      </Link>
      <Suspense fallback={<p>Loading…</p>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
