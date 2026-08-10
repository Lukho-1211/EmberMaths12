"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { DEMO_PASSWORD } from "@/lib/mock/seed";
import { useStore } from "@/lib/store";

export default function AdminUsersPage() {
  const { state, deleteUser, createTeacher } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_PASSWORD);

  const removable = state.users.filter((u) => u.role === "student" || u.role === "parent");
  const teachers = state.users.filter((u) => u.role === "teacher");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createTeacher({ name, email, password });
    setName("");
    setEmail("");
    setPassword(DEMO_PASSWORD);
  }

  return (
    <div>
      <PageHeader
        title="Users & teachers"
        subtitle="Create teachers and remove student or parent accounts."
      />

      <form
        onSubmit={onCreate}
        className="mb-8 grid gap-3 rounded-xl border border-border bg-white p-5 md:grid-cols-4"
      >
        <input
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="Teacher name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy">
          Create teacher
        </button>
      </form>

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
                  onClick={() => deleteUser(u.id)}
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
