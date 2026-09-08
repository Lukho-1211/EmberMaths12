"use client";

import { FormEvent, useRef, useState } from "react";
import { Camera, LogOut, Moon, Sun, Trash2 } from "lucide-react";
import { MunicipalityAutocomplete } from "@/components/municipality-autocomplete";
import { PageHeader } from "@/components/app-shell";
import { PasswordInput } from "@/components/password-input";
import { SA_PROVINCES } from "@/lib/sa-geography";
import { useStore, type Theme } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40";

const fieldReadonlyClass =
  "w-full cursor-not-allowed rounded-md border border-border bg-surface px-3 py-2 text-muted outline-none";

type ProfileForm = {
  name: string;
  password: string;
  confirmPassword: string;
  province: string;
  municipality: string;
};

const emptyForm = (): ProfileForm => ({
  name: "",
  password: "",
  confirmPassword: "",
  province: "",
  municipality: "",
});

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function SettingsPanel() {
  const { user, updateProfile, uploadAvatar, clearAvatar, logout, theme, setTheme } = useStore();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [syncedUserKey, setSyncedUserKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userKey = user
    ? `${user.id}|${user.name}|${user.province ?? ""}|${user.municipality ?? ""}`
    : null;

  if (user && userKey !== syncedUserKey) {
    setSyncedUserKey(userKey);
    setForm({
      name: user.name,
      password: "",
      confirmPassword: "",
      province: user.province ?? "",
      municipality: user.municipality ?? "",
    });
  }

  if (!user) return null;

  const isStudent = user.role === "student";
  const { name, password, confirmPassword, province, municipality } = form;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const pwd = password.trim();
    const confirm = confirmPassword.trim();
    if (pwd || confirm) {
      if (!pwd || !confirm) {
        setError("Enter and confirm your new password, or leave both blank.");
        return;
      }
      if (pwd.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (pwd !== confirm) {
        setError("Passwords do not match.");
        return;
      }
    }

    const result = await updateProfile({
      name,
      password: pwd ? pwd : undefined,
      province: isStudent ? province : undefined,
      municipality: isStudent ? municipality : undefined,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    setSuccess("Your details have been saved.");
  }

  function onThemeChange(next: Theme) {
    setTheme(next);
  }

  async function onAvatarSelected(file: File | undefined) {
    if (!file) return;
    setAvatarError("");
    setAvatarBusy(true);
    const result = await uploadAvatar(file);
    setAvatarBusy(false);
    if (!result.ok) {
      setAvatarError(result.error);
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onRemoveAvatar() {
    setAvatarError("");
    setAvatarBusy(true);
    const result = await clearAvatar();
    setAvatarBusy(false);
    if (!result.ok) setAvatarError(result.error);
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

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-ember-gold/40 bg-[#14213d]">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-xl font-semibold text-ember-gold">
                {initialsFromName(user.name)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
            <p className="text-sm font-medium text-foreground">Profile photo</p>
            <p className="text-xs text-muted">JPEG, PNG, or WebP · max 2 MB. Shows in the navigation.</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id="settings-avatar"
                disabled={avatarBusy}
                onChange={(e) => void onAvatarSelected(e.target.files?.[0])}
              />
              <label
                htmlFor="settings-avatar"
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-ember-gold px-3 py-2 text-xs font-bold text-[#14213d] transition hover:brightness-105 ${
                  avatarBusy ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <Camera size={14} /> {avatarBusy ? "Uploading…" : "Upload photo"}
              </label>
              {user.avatarUrl ? (
                <button
                  type="button"
                  disabled={avatarBusy}
                  onClick={() => void onRemoveAvatar()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-surface disabled:opacity-60"
                >
                  <Trash2 size={14} /> Remove
                </button>
              ) : null}
            </div>
            {avatarError ? <p className="text-sm text-danger">{avatarError}</p> : null}
          </div>
        </div>

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
              id="settings-email"
              className={fieldReadonlyClass}
              type="email"
              value={user.email}
              readOnly
              disabled
              autoComplete="email"
              aria-describedby="settings-email-hint"
            />
            <span id="settings-email-hint" className="mt-1 block text-xs text-muted">
              Email cannot be changed.
            </span>
          </label>
          <div className="block text-sm">
            <label htmlFor="settings-password" className="mb-1 block font-medium text-foreground">
              New password
            </label>
            <PasswordInput
              id="settings-password"
              className={fieldClass}
              value={password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              minLength={6}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </div>
          <div className="block text-sm">
            <label
              htmlFor="settings-password-confirm"
              className="mb-1 block font-medium text-foreground"
            >
              Confirm new password
            </label>
            <PasswordInput
              id="settings-password-confirm"
              className={fieldClass}
              value={confirmPassword}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              minLength={6}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
          </div>
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
            void logout().then(() => {
              window.location.assign("/");
            });
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface"
        >
          <LogOut size={16} /> Log out
        </button>
      </section>
    </div>
  );
}
