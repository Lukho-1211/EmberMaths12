"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { useStore } from "@/lib/store";
import type { WeekDay } from "@/lib/types";

const DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

export default function AdminTermsPage() {
  const { state, upsertWeekLesson, setWeekTestTitle, setPreExamTitle } = useStore();
  const [termId, setTermId] = useState(state.terms[0]?.id ?? "term-1");
  const term = state.terms.find((t) => t.id === termId) ?? state.terms[0];
  const [weekId, setWeekId] = useState(term?.weeks[0]?.id ?? "");
  const week = term?.weeks.find((w) => w.id === weekId) ?? term?.weeks[0];
  const [day, setDay] = useState<WeekDay>("monday");
  const lesson = week?.lessons.find((l) => l.day === day);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [testTitle, setTestTitle] = useState("");
  const [preTitle, setPreTitle] = useState("");

  function loadLessonFields(nextDay: WeekDay) {
    const l = week?.lessons.find((x) => x.day === nextDay);
    setTitle(l?.title ?? "");
    setDescription(l?.description ?? "");
  }

  function saveLesson(e: FormEvent) {
    e.preventDefault();
    if (!term || !week) return;
    upsertWeekLesson(term.id, week.id, day, { title, description });
  }

  return (
    <div>
      <PageHeader
        title="Terms & weekly lessons"
        subtitle="Create and edit Term 1–4: Mon–Fri lessons, Saturday week tests, and pre-exams."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {state.terms.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTermId(t.id);
              setWeekId(t.weeks[0]?.id ?? "");
            }}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              term?.id === t.id ? "bg-ember-gold text-ember-navy" : "border border-border bg-white"
            }`}
          >
            Term {t.number}
          </button>
        ))}
      </div>

      {term ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-display text-xl">{term.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {term.weeks.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setWeekId(w.id);
                    const mon = w.lessons.find((l) => l.day === "monday");
                    setTitle(mon?.title ?? "");
                    setDescription(mon?.description ?? "");
                    setDay("monday");
                    setTestTitle(w.weekTest.title);
                  }}
                  className={`rounded-md px-3 py-1.5 text-sm ${
                    week?.id === w.id ? "bg-ember-navy text-white" : "bg-surface"
                  }`}
                >
                  Week {w.number}
                </button>
              ))}
            </div>

            {week ? (
              <>
                <p className="mt-4 text-sm text-muted">Topic: {week.topic}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDay(d);
                        loadLessonFields(d);
                      }}
                      className={`rounded-full px-3 py-1 text-xs capitalize ${
                        day === d ? "bg-ember-gold font-semibold text-ember-navy" : "bg-ember-gray"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                  <span className="rounded-full bg-ember-navy px-3 py-1 text-xs text-white">
                    Saturday · Week test
                  </span>
                </div>

                <form onSubmit={saveLesson} className="mt-5 space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Lesson title</span>
                    <input
                      className="w-full rounded-md border border-border px-3 py-2"
                      value={title || lesson?.title || ""}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Description</span>
                    <textarea
                      className="w-full rounded-md border border-border px-3 py-2"
                      rows={3}
                      value={description || lesson?.description || ""}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white"
                  >
                    Save lesson
                  </button>
                </form>
              </>
            ) : null}
          </div>

          <div className="space-y-4">
            {week ? (
              <form
                className="rounded-xl border border-border bg-white p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setWeekTestTitle(term.id, week.id, testTitle || week.weekTest.title);
                }}
              >
                <h3 className="font-semibold">Saturday week test</h3>
                <input
                  className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={testTitle || week.weekTest.title}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
                <p className="mt-2 text-xs text-muted">
                  {week.weekTest.questions.length} questions · pass mark {week.weekTest.passMark}%
                </p>
                <button
                  type="submit"
                  className="mt-3 rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
                >
                  Update week test
                </button>
              </form>
            ) : null}

            <form
              className="rounded-xl border border-border bg-white p-5"
              onSubmit={(e) => {
                e.preventDefault();
                setPreExamTitle(term.id, preTitle || term.preExam.title);
              }}
            >
              <h3 className="font-semibold">Pre-exam (after Week 4)</h3>
              <input
                className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
                value={preTitle || term.preExam.title}
                onChange={(e) => setPreTitle(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted">
                {term.preExam.questions.length} questions · pass mark {term.preExam.passMark}%
              </p>
              <button
                type="submit"
                className="mt-3 rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white"
              >
                Update pre-exam
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
