"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { MunicipalityAutocomplete } from "@/components/municipality-autocomplete";
import { PageHeader } from "@/components/app-shell";
import { SA_PROVINCES } from "@/lib/sa-geography";
import { useStore, type Theme } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40";

export function SettingsPanel() {
  const { user, updateProfile, logout, theme, setTheme } = useStore();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setProvince(user.province ?? "");
    setMunicipality(user.municipality ?? "");
    setPassword("");
  }, [user]);

  if (!user) return null;

  const isStudent = user.role === "student";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const result = updateProfile({
      name,
      email,
      password: password.trim() ? password : undefined,
      province: isStudent ? province : undefined,
      municipality: isStudent ? municipality : undefined,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword("");
    setSuccess("Your details have been saved.");
  }

  function onThemeChange(next: Theme) {
    setTheme(next);
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Settings" subtitle="Update your account, appearance, and sign out." />

      <section className="rounded-xl border border-border bg-ember-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Choose light or dark mode for Ember Maths12.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface p-1">
          <button
            type="button"
            onClick={() => onThemeChange("light")}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
              theme === "light"
                ? "bg-ember-gold text-[#14213d]"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            <Sun size={16} /> Light
          </button>
          <button
            type="button"
            onClick={() => onThemeChange("dark")}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
              theme === "dark"
                ? "bg-ember-gold text-[#14213d]"
                : "text-muted hover:bg-background hover:text-foreground"
            }`}
          >
            <Moon size={16} /> Dark
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-ember-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-foreground">Account details</h2>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user.role}. Leave password blank to keep your current one.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Full name</span>
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Email</span>
            <input
              className={fieldClass}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">New password</span>
            <input
              className={fieldClass}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </label>
          {isStudent ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-foreground">Province</span>
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
                <span className="mb-1 block font-medium text-foreground">Municipality</span>
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
          {success ? <p className="text-sm text-success">{success}</p> : null}
          <button
            type="submit"
            className="w-full cursor-pointer rounded-md bg-ember-gold py-2.5 text-sm font-bold text-[#14213d] transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold"
          >
            Save changes
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-border bg-ember-white p-6 shadow-sm">
        <h2 className="font-display text-xl text-foreground">Session</h2>
        <p className="mt-1 text-sm text-muted">Sign out of Ember Maths12 on this device.</p>
        <button
          type="button"
          onClick={() => {
            void logout().then(() => router.push("/"));
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
        >
          <LogOut size={16} /> Log out
        </button>
      </section>
    </div>
  );
}
