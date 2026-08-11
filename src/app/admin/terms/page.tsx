"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { FileText, RefreshCw, Trash2, Upload } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  generateLessonTestFromResources,
  isExtractableLessonResource,
} from "@/lib/generate-lesson-mcqs";
import { MAX_LESSON_FILE_BYTES, resourceFromLessonFile } from "@/lib/lesson-file";
import { useStore } from "@/lib/store";
import type { Resource, WeekDay } from "@/lib/types";

const DAYS: WeekDay[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

function ExamFileUploader({
  resources,
  onChange,
  label = "Exam paper",
  description = "Upload PDF or Markdown (.md) — converted into a narrated student video walkthrough on the assessment page.",
  emptyLabel = "No exam paper uploaded yet.",
}: {
  resources: Resource[];
  onChange: (next: Resource[]) => void;
  label?: string;
  description?: string;
  emptyLabel?: string;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const resource = await resourceFromLessonFile(file);
      onChange([...resources, resource]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-border bg-surface/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted">
            {description} Max {(MAX_LESSON_FILE_BYTES / (1024 * 1024)).toFixed(1)} MB per file.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold hover:border-ember-gold">
          <Upload size={16} />
          {uploading ? "Uploading…" : "Add PDF / Markdown"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.markdown,application/pdf,text/markdown,text/x-markdown"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void onFileSelected(e.target.files)}
          />
        </label>
      </div>

      {uploadError ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {uploadError}
        </p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {resources.length === 0 ? (
          <li className="text-xs text-muted">{emptyLabel}</li>
        ) : (
          resources.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-md border border-border bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-start gap-2">
                <FileText size={16} className="mt-0.5 shrink-0 text-ember-navy" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-xs uppercase text-muted">
                    {r.type}
                    {r.fileName ? ` · ${r.fileName}` : ""}
                    {r.url.startsWith("data:") ? " · uploaded" : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChange(resources.filter((x) => x.id !== r.id))}
                className="shrink-0 rounded p-1 text-muted hover:bg-ember-gray hover:text-ember-navy"
                aria-label={`Remove ${r.title}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function AdminTermsPage() {
  const { state, upsertWeekLesson, setWeekTest, setPreExam } = useStore();
  const [termId, setTermId] = useState(state.terms[0]?.id ?? "term-1");
  const term = state.terms.find((t) => t.id === termId) ?? state.terms[0];
  const [weekId, setWeekId] = useState(term?.weeks[0]?.id ?? "");
  const week = term?.weeks.find((w) => w.id === weekId) ?? term?.weeks[0];
  const [day, setDay] = useState<WeekDay>("monday");
  const lesson = week?.lessons.find((l) => l.day === day);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [generateNote, setGenerateNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [testTitle, setTestTitle] = useState("");
  const [testResources, setTestResources] = useState<Resource[]>([]);
  const [testMemoResources, setTestMemoResources] = useState<Resource[]>([]);
  const [testSavedFlash, setTestSavedFlash] = useState(false);
  const [preTitle, setPreTitle] = useState("");
  const [preResources, setPreResources] = useState<Resource[]>([]);
  const [preMemoResources, setPreMemoResources] = useState<Resource[]>([]);
  const [preSavedFlash, setPreSavedFlash] = useState(false);

  function loadLessonFields(nextDay: WeekDay, nextWeek = week) {
    const l = nextWeek?.lessons.find((x) => x.day === nextDay);
    setTitle(l?.title ?? "");
    setDescription(l?.description ?? "");
    setResources(l?.resources ?? []);
    setUploadError(null);
  }

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description);
      setResources(lesson.resources);
    }
  }, [lesson?.id]);

  useEffect(() => {
    if (!week) return;
    setTestTitle(week.weekTest.title);
    setTestResources(week.weekTest.resources ?? []);
    setTestMemoResources(week.weekTest.memoResources ?? []);
    // Sync when switching weeks or after store updates for this week test.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: week.weekTest identity
  }, [week?.id, week?.weekTest]);

  useEffect(() => {
    if (!term) return;
    setPreTitle(term.preExam.title);
    setPreResources(term.preExam.resources ?? []);
    setPreMemoResources(term.preExam.memoResources ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: term.preExam identity
  }, [term?.id, term?.preExam]);

  async function saveLesson(e: FormEvent) {
    e.preventDefault();
    if (!term || !week || !lesson) return;
    setSaving(true);
    setGenerateNote(null);
    setUploadError(null);
    try {
      const nextTitle = title.trim() || lesson.title || "";
      const nextDescription = description.trim() || lesson.description || "";
      const patch: {
        title: string;
        description: string;
        resources: Resource[];
        lessonTest?: typeof lesson.lessonTest;
      } = {
        title: nextTitle,
        description: nextDescription,
        resources,
      };

      const hasExtractable = resources.some(isExtractableLessonResource);
      if (hasExtractable) {
        const generated = await generateLessonTestFromResources({
          lesson: { id: lesson.id, title: nextTitle, day },
          resources,
          memoResources: lesson.lessonTest?.memoResources ?? [],
        });
        if (generated) {
          patch.lessonTest = generated;
          setGenerateNote(
            `Questions generated from lesson materials (${generated.questions.length} MCQs).`,
          );
        } else {
          setGenerateNote(
            "Could not extract text from materials — kept existing lesson test questions.",
          );
        }
      }

      upsertWeekLesson(term.id, week.id, day, patch);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to save lesson.");
    } finally {
      setSaving(false);
    }
  }

  async function regenerateLessonQuestions() {
    if (!term || !week || !lesson) return;
    const hasExtractable = resources.some(isExtractableLessonResource);
    if (!hasExtractable) {
      setGenerateNote("Upload a PDF or Markdown file before regenerating questions.");
      return;
    }
    setRegenerating(true);
    setGenerateNote(null);
    setUploadError(null);
    try {
      const nextTitle = title.trim() || lesson.title || "";
      const generated = await generateLessonTestFromResources({
        lesson: { id: lesson.id, title: nextTitle, day },
        resources,
        memoResources: lesson.lessonTest?.memoResources ?? [],
        regenerateToken: String(Date.now()),
      });
      if (!generated) {
        setGenerateNote("Could not extract text from materials — questions unchanged.");
        return;
      }
      upsertWeekLesson(term.id, week.id, day, {
        title: nextTitle,
        description: description.trim() || lesson.description || "",
        resources,
        lessonTest: generated,
      });
      setGenerateNote(
        `Questions regenerated from lesson materials (${generated.questions.length} MCQs).`,
      );
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to regenerate questions.");
    } finally {
      setRegenerating(false);
    }
  }

  async function onFileSelected(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const resource = await resourceFromLessonFile(file);
      setResources((prev) => [...prev, resource]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeResource(id: string) {
    setResources((prev) => prev.filter((r) => r.id !== id));
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
                    setDay("monday");
                    loadLessonFields("monday", w);
                    setTestTitle(w.weekTest.title);
                    setTestResources(w.weekTest.resources ?? []);
                    setTestMemoResources(w.weekTest.memoResources ?? []);
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
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">Description</span>
                    <textarea
                      className="w-full rounded-md border border-border px-3 py-2"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>

                  <div className="rounded-lg border border-dashed border-border bg-surface/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Lesson materials</p>
                        <p className="text-xs text-muted">
                          Upload PDF or Markdown (.md) — becomes the student Video walkthrough
                          with narration. Max{" "}
                          {(MAX_LESSON_FILE_BYTES / (1024 * 1024)).toFixed(1)} MB per file.
                        </p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold hover:border-ember-gold">
                        <Upload size={16} />
                        {uploading ? "Uploading…" : "Add PDF / Markdown"}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.md,.markdown,application/pdf,text/markdown,text/x-markdown"
                          className="sr-only"
                          disabled={uploading}
                          onChange={(e) => void onFileSelected(e.target.files)}
                        />
                      </label>
                    </div>

                    {uploadError ? (
                      <p className="mt-3 text-sm text-danger" role="alert">
                        {uploadError}
                      </p>
                    ) : null}

                    <ul className="mt-3 space-y-2">
                      {resources.length === 0 ? (
                        <li className="text-xs text-muted">No materials attached yet.</li>
                      ) : (
                        resources.map((r) => (
                          <li
                            key={r.id}
                            className="flex items-start justify-between gap-3 rounded-md border border-border bg-white px-3 py-2"
                          >
                            <div className="flex min-w-0 items-start gap-2">
                              <FileText size={16} className="mt-0.5 shrink-0 text-ember-navy" />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{r.title}</p>
                                <p className="text-xs uppercase text-muted">
                                  {r.type}
                                  {r.fileName ? ` · ${r.fileName}` : ""}
                                  {r.url.startsWith("data:") ? " · uploaded" : ""}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeResource(r.id)}
                              className="shrink-0 rounded p-1 text-muted hover:bg-ember-gray hover:text-ember-navy"
                              aria-label={`Remove ${r.title}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <p className="text-xs text-muted">
                        {lesson?.lessonTest
                          ? `${lesson.lessonTest.questions.length} lesson-test questions · pass mark ${lesson.lessonTest.passMark}%`
                          : "No lesson test yet — save with PDF/Markdown to generate questions."}
                      </p>
                      <button
                        type="button"
                        onClick={() => void regenerateLessonQuestions()}
                        disabled={regenerating || saving}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold hover:border-ember-gold disabled:opacity-60"
                      >
                        <RefreshCw size={14} />
                        {regenerating ? "Regenerating…" : "Regenerate questions"}
                      </button>
                    </div>
                    {generateNote ? (
                      <p className="mt-2 text-xs text-muted" role="status">
                        {generateNote}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-muted">
                        Questions are generated from uploaded PDF/Markdown text when you save.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving || regenerating}
                      className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save lesson"}
                    </button>
                    {savedFlash ? (
                      <span className="text-sm font-medium text-success">Lesson saved</span>
                    ) : null}
                  </div>
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
                  setWeekTest(term.id, week.id, {
                    title: testTitle.trim() || week.weekTest.title,
                    resources: testResources,
                    memoResources: testMemoResources,
                  });
                  setTestSavedFlash(true);
                  window.setTimeout(() => setTestSavedFlash(false), 1800);
                }}
              >
                <h3 className="font-semibold">Saturday week test</h3>
                <input
                  className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                />
                <p className="mt-2 text-xs text-muted">
                  {week.weekTest.questions.length} questions · pass mark {week.weekTest.passMark}%
                </p>
                <ExamFileUploader
                  label="Week test paper"
                  resources={testResources}
                  onChange={setTestResources}
                />
                <ExamFileUploader
                  label="Week test memo"
                  description="Upload PDF or Markdown (.md) mark scheme used to correct learner paper scans. Not shown to students."
                  emptyLabel="No memo uploaded yet."
                  resources={testMemoResources}
                  onChange={setTestMemoResources}
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-md bg-ember-gold px-4 py-2 text-sm font-bold text-ember-navy"
                  >
                    Update week test
                  </button>
                  {testSavedFlash ? (
                    <span className="text-sm font-medium text-success">Week test saved</span>
                  ) : null}
                </div>
              </form>
            ) : null}

            <form
              className="rounded-xl border border-border bg-white p-5"
              onSubmit={(e) => {
                e.preventDefault();
                setPreExam(term.id, {
                  title: preTitle.trim() || term.preExam.title,
                  resources: preResources,
                  memoResources: preMemoResources,
                });
                setPreSavedFlash(true);
                window.setTimeout(() => setPreSavedFlash(false), 1800);
              }}
            >
              <h3 className="font-semibold">Pre-exam (after Week 4)</h3>
              <input
                className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm"
                value={preTitle}
                onChange={(e) => setPreTitle(e.target.value)}
              />
              <p className="mt-2 text-xs text-muted">
                {term.preExam.questions.length} questions · pass mark {term.preExam.passMark}%
              </p>
              <ExamFileUploader
                label="Pre-exam paper"
                resources={preResources}
                onChange={setPreResources}
              />
              <ExamFileUploader
                label="Pre-exam memo"
                description="Upload PDF or Markdown (.md) mark scheme used to correct learner paper scans. Not shown to students."
                emptyLabel="No memo uploaded yet."
                resources={preMemoResources}
                onChange={setPreMemoResources}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="rounded-md bg-ember-navy px-4 py-2 text-sm font-semibold text-white"
                >
                  Update pre-exam
                </button>
                {preSavedFlash ? (
                  <span className="text-sm font-medium text-success">Pre-exam saved</span>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
