"use client";

import { FormEvent, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { useStore } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40 disabled:opacity-60";

export function CreateAdminForm({ className = "" }: { className?: string }) {
  const { createAdmin } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await createAdmin({ name, email, password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(`Admin account created for ${email.trim().toLowerCase()}.`);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={`space-y-3 ${className}`.trim()}>
      <p className="text-sm font-medium text-ember-navy">Create admin</p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Full name</span>
        <input
          className={fieldClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          autoComplete="name"
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
          disabled={loading}
          autoComplete="email"
        />
      </label>
      <div className="block text-sm">
        <label htmlFor="create-admin-password" className="mb-1 block font-medium">
          Password
        </label>
        <PasswordInput
          id="create-admin-password"
          className={fieldClass}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
          autoComplete="new-password"
        />
      </div>
      <div className="block text-sm">
        <label htmlFor="create-admin-confirm-password" className="mb-1 block font-medium">
          Confirm password
        </label>
        <PasswordInput
          id="create-admin-confirm-password"
          className={fieldClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
          autoComplete="new-password"
        />
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full cursor-pointer rounded-md bg-ember-gold py-2.5 text-sm font-bold text-ember-navy transition duration-200 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-gold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create admin"}
      </button>
    </form>
  );
}
