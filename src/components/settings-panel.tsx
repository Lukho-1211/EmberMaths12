"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Moon, Sun } from "lucide-react";
import { MunicipalityAutocomplete } from "@/components/municipality-autocomplete";
import { PageHeader } from "@/components/app-shell";
import { SA_PROVINCES } from "@/lib/sa-geography";
import { useStore, type Theme } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40";

type ProfileForm = {
  name: string;
  email: string;
  password: string;
  province: string;
  municipality: string;
};

const emptyForm = (): ProfileForm => ({
  name: "",
  email: "",
  password: "",
  province: "",
  municipality: "",
});

export function SettingsPanel() {
  const { user, updateProfile, logout, theme, setTheme } = useStore();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [syncedUserKey, setSyncedUserKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userKey = user
    ? `${user.id}|${user.name}|${user.email}|${user.province ?? ""}|${user.municipality ?? ""}`
    : null;

  if (user && userKey !== syncedUserKey) {
    setSyncedUserKey(userKey);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      province: user.province ?? "",
      municipality: user.municipality ?? "",
    });
  }

  if (!user) return null;

  const isStudent = user.role === "student";
  const { name, email, password, province, municipality } = form;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const result = await updateProfile({
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
    setForm((prev) => ({ ...prev, password: "" }));
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
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Email</span>
            <input
              className={fieldClass}
              type="email"
              value={email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">New password</span>
            <input
              className={fieldClass}
              type="password"
              value={password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
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
                    setForm((prev) => ({
                      ...prev,
                      province: e.target.value,
                      municipality: "",
                    }));
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
                  onChange={(next) =>
                    setForm((prev) => ({ ...prev, municipality: next }))
                  }
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
