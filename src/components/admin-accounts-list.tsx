"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useStore } from "@/lib/store";

export function AdminAccountsList({ className = "" }: { className?: string }) {
  const { state, user, deleteUser } = useStore();
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; name: string } | null>(null);

  const admins = state.users.filter((u) => u.role === "admin");

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
    <div className={className}>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {admins.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted">No admins loaded.</li>
        ) : (
          admins.map((a) => {
            const isYou = a.id === user?.id;
            return (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {a.name}
                    {isYou ? (
                      <span className="ml-2 text-xs font-semibold uppercase text-ember-gold">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-muted">{a.email}</p>
                </div>
                {isYou ? null : (
                  <button
                    type="button"
                    disabled={!!deletingId}
                    onClick={() => setPending({ id: a.id, name: a.name })}
                    className="shrink-0 rounded-md border border-danger/30 px-3 py-1 text-danger hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })
        )}
      </ul>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}

      <ConfirmDialog
        open={!!pending}
        title="Delete admin?"
        description={
          <>
            Are you sure you want to delete admin <strong>{pending?.name}</strong>? This
            cannot be undone.
          </>
        }
        confirmLabel="Delete admin"
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
