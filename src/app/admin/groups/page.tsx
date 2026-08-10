"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";

export default function AdminGroupsPage() {
  const {
    state,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteGroup,
  } = useStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [termId, setTermId] = useState(state.terms[0]?.id ?? "");
  const students = state.users.filter((u) => u.role === "student");

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createGroup({ name, description, termId: termId || undefined });
    setName("");
    setDescription("");
  }

  return (
    <div>
      <PageHeader
        title="Study groups"
        subtitle="Create groups so students can revise CAPS topics together."
      />

      <form
        onSubmit={onCreate}
        className="mb-8 grid gap-3 rounded-xl border border-border bg-white p-5 md:grid-cols-2"
      >
        <input
          className="rounded-md border border-border px-3 py-2 text-sm"
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          className="rounded-md border border-border px-3 py-2 text-sm"
          value={termId}
          onChange={(e) => setTermId(e.target.value)}
        >
          {state.terms.map((t) => (
            <option key={t.id} value={t.id}>
              Term {t.number}
            </option>
          ))}
        </select>
        <textarea
          className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
        />
        <button
          type="submit"
          className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white md:col-span-2 md:w-fit"
        >
          Create group
        </button>
      </form>

      <div className="grid gap-4">
        {state.groups.map((g) => (
          <div key={g.id} className="rounded-xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">{g.name}</h2>
                <p className="text-sm text-muted">{g.description}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteGroup(g.id)}
                className="text-sm text-danger"
              >
                Delete group
              </button>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Members
              </p>
              <div className="flex flex-wrap gap-2">
                {students.map((s) => {
                  const inGroup = g.memberIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() =>
                        inGroup
                          ? removeMemberFromGroup(g.id, s.id)
                          : addMemberToGroup(g.id, s.id)
                      }
                      className={`rounded-full px-3 py-1 text-xs ${
                        inGroup
                          ? "bg-ember-gold font-semibold text-ember-navy"
                          : "bg-ember-gray text-ember-navy"
                      }`}
                    >
                      {inGroup ? "✓ " : "+ "}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
