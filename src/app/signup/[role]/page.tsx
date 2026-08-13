"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { MunicipalityAutocomplete } from "@/components/municipality-autocomplete";
import { isValidMunicipality, SA_PROVINCES } from "@/lib/sa-geography";
import { isRole, roleLabel } from "@/lib/roles";
import { useStore } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40";

export default function RoleSignupPage() {
  const { signup } = useStore();
  const router = useRouter();
  const params = useParams<{ role: string }>();
  const roleParam = params.role;
  const role = isRole(roleParam) ? roleParam : null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!role) router.replace("/signup");
  }, [role, router]);

  if (!role) {
    return (
      <div className="ember-wash flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <p className="text-sm text-muted">Redirecting…</p>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!role) return;
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
    <div className="ember-wash flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 font-display text-3xl text-ember-navy">
        EmberMaths<span className="text-ember-gold">12</span>
      </Link>
      <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-ember-white p-8 shadow-sm">
        <h1 className="font-display text-3xl text-ember-navy">{roleLabel(role)} sign up</h1>
        <p className="mt-2 text-sm text-muted">
          Create your EmberMaths12 {role} account.
        </p>
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
          <Link
            href={`/login/${role}`}
            className="font-semibold text-ember-navy underline decoration-ember-gold"
          >
            Log in as {roleLabel(role).toLowerCase()}
          </Link>
        </p>
        <p className="mt-2 text-sm text-muted">
          <Link
            href="/signup"
            className="font-semibold text-ember-navy underline decoration-ember-gold"
          >
            Choose a different portal
          </Link>
        </p>
      </div>
    </div>
  );
}
