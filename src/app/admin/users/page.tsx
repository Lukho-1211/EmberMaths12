"use client";

import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function AdminUsersPage() {
  const { state, deleteUser } = useStore();

  const removable = state.users.filter((u) => u.role === "student" || u.role === "parent");
  const teachers = state.users.filter((u) => u.role === "teacher");

  return (
    <div>
      <PageHeader
        title="Users & teachers"
        subtitle="Remove student or parent accounts."
      />

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
