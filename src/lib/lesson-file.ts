import type { Lesson, Resource } from "@/lib/types";
import { uploadLessonFile } from "@/lib/supabase/app-state";

/** Soft cap for lesson uploads (Supabase Storage). */
export const MAX_LESSON_FILE_BYTES = 20 * 1024 * 1024;

function isUploadedResourceUrl(url: string) {
  return (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

/** First Markdown resource on a lesson (for Text lesson view). */
export function primaryLessonMarkdownResource(lesson: Lesson): Resource | undefined {
  return lesson.resources.find(
    (r) => r.type === "markdown" && isUploadedResourceUrl(r.url),
  );
}

/**
 * Uploaded Markdown and PDF materials for the student Text tab.
 * Skips seed placeholders (`url: "#"`). Markdown first, then PDFs.
 */
export function lessonTextResources(lesson: Lesson): Resource[] {
  const uploaded = lesson.resources.filter(
    (r) =>
      (r.type === "markdown" || r.type === "pdf") && isUploadedResourceUrl(r.url),
  );
  const markdown = uploaded.filter((r) => r.type === "markdown");
  const pdfs = uploaded.filter((r) => r.type === "pdf");
  return [...markdown, ...pdfs];
}

function isMarkdownFile(file: File) {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".md") ||
    name.endsWith(".markdown") ||
    file.type === "text/markdown" ||
    file.type === "text/x-markdown"
  );
}

function isPdfFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || file.type === "application/pdf";
}

export function lessonResourceTypeFromFile(file: File): Resource["type"] | null {
  if (isPdfFile(file)) return "pdf";
  if (isMarkdownFile(file)) return "markdown";
  return null;
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Upload a PDF/Markdown lesson file to Supabase Storage and return a Resource.
 * Markdown is also inlined as a data URL fallback so offline decoding still works
 * when the Storage fetch is unavailable; primary `url` is always the public Storage URL.
 */
export async function resourceFromLessonFile(file: File): Promise<Resource> {
  const type = lessonResourceTypeFromFile(file);
  if (!type) {
    throw new Error("Only PDF or Markdown (.md) files are supported.");
  }
  if (file.size > MAX_LESSON_FILE_BYTES) {
    throw new Error("File is too large (max 20 MB).");
  }

  const title = file.name.replace(/\.(pdf|md|markdown)$/i, "") || file.name;
  const id = crypto.randomUUID();

  const uploaded = await uploadLessonFile(file, "lesson-resources");
  if ("error" in uploaded) {
    throw new Error(uploaded.error);
  }

  return {
    id,
    title,
    type,
    fileName: file.name,
    url: uploaded.url,
  };
}

/** Decode markdown from a data URL or fetch text from a Storage/http URL. */
export async function decodeMarkdownResourceAsync(url: string): Promise<string | null> {
  if (url.startsWith("data:text/markdown")) {
    return decodeMarkdownResource(url);
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function decodeMarkdownResource(url: string): string | null {
  if (!url.startsWith("data:text/markdown")) return null;
  const comma = url.indexOf(",");
  if (comma === -1) return null;
  const meta = url.slice(0, comma);
  const data = url.slice(comma + 1);
  try {
    if (meta.includes(";base64")) {
      return atob(data);
    }
    return decodeURIComponent(data);
  } catch {
    return null;
  }
}

/** @deprecated Prefer decodeMarkdownResourceAsync for Storage URLs. */
export async function ensureMarkdownText(file?: File): Promise<string | null> {
  if (!file) return null;
  return readAsText(file);
}
