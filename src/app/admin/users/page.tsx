"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { AdminAccountsList } from "@/components/admin-accounts-list";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CreateAdminForm } from "@/components/create-admin-form";
import { useStore } from "@/lib/store";

export default function AdminUsersPage() {
  const { state, deleteUser } = useStore();
  const [pending, setPending] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const removable = state.users.filter((u) => u.role === "student" || u.role === "parent");
  const teachers = state.users.filter((u) => u.role === "teacher");

  async function onConfirmDelete() {
    if (!pending || deletingId) return;

    setError("");
    setDeletingId(pending.id);
    try {
      const result = await deleteUser(pending.id);
      if (!result.ok) {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
      setPending(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Users & teachers"
        subtitle="Create admin accounts, remove other admins, and delete student or parent accounts."
      />

      <div className="mb-6 overflow-hidden rounded-xl border border-border bg-white">
        <h2 className="bg-ember-navy px-4 py-3 text-sm font-semibold text-white">Admins</h2>
        <div className="grid gap-6 p-4 lg:grid-cols-2">
          <AdminAccountsList />
          <CreateAdminForm />
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
                  disabled={!!deletingId}
                  onClick={() => setPending({ id: u.id, name: u.name, role: u.role })}
                  className="rounded-md border border-danger/30 px-3 py-1 text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {error ? <p className="px-4 py-2 text-sm text-danger">{error}</p> : null}
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Delete user?"
        description={
          <>
            Are you sure you want to delete <strong>{pending?.name}</strong> ({pending?.role})?
            This cannot be undone.
          </>
        }
        confirmLabel="Delete"
        busy={deletingId === pending?.id}
        onCancel={() => {
          if (!deletingId) setPending(null);
        }}
        onConfirm={() => {
          void onConfirmDelete();
        }}
      />
    </div>
  );
}
