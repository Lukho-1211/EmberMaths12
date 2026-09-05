"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { PasswordInput } from "@/components/password-input";
import { useStore } from "@/lib/store";

const fieldClass =
  "w-full rounded-md border border-border px-3 py-2 outline-none focus:border-ember-gold focus:ring-2 focus:ring-ember-gold/40 disabled:opacity-60";

export default function AdminUsersPage() {
  const { state, deleteUser, createAdmin } = useStore();

  const removable = state.users.filter((u) => u.role === "student" || u.role === "parent");
  const teachers = state.users.filter((u) => u.role === "teacher");
  const admins = state.users.filter((u) => u.role === "admin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onCreateAdmin(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setSuccess("");
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
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users & teachers"
        subtitle="Create admin accounts and remove student or parent accounts."
      />

      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-white">
        <h2 className="bg-ember-navy px-4 py-3 text-sm font-semibold text-white">Admins</h2>
        <div className="grid gap-6 p-4 lg:grid-cols-2">
          <ul className="divide-y divide-border rounded-lg border border-border">
            {admins.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">No admins loaded.</li>
            ) : (
              admins.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-muted">{a.email}</p>
                </li>
              ))
            )}
          </ul>

          <form onSubmit={onCreateAdmin} className="space-y-3">
            <p className="text-sm font-medium text-ember-navy">Create admin</p>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Full name</span>
              <input
                className={fieldClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <h2 className="bg-ember-navy px-4 py-3 text-sm font-semibold text-white">Teachers</h2>
          <ul className="divide-y divide-border">
            {teachers.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-muted">{t.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <h2 className="bg-ember-navy px-4 py-3 text-sm font-semibold text-white">
            Students & parents
          </h2>
          <ul className="divide-y divide-border">
            {removable.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {u.name}{" "}
                    <span className="text-xs uppercase text-muted">({u.role})</span>
                  </p>
                  <p className="text-muted">{u.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteUser(u.id)}
                  className="rounded-md border border-danger/30 px-3 py-1 text-danger hover:bg-danger/5"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
