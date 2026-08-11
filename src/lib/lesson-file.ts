import type { Lesson, Resource } from "@/lib/types";

/** Soft cap for in-browser lesson uploads (mock storage). */
export const MAX_LESSON_FILE_BYTES = 20 * 1024 * 1024;

/** First uploaded Markdown resource on a lesson (for Text lesson view). */
export function primaryLessonMarkdownResource(lesson: Lesson): Resource | undefined {
  return lesson.resources.find(
    (r) => r.type === "markdown" && r.url.startsWith("data:text/markdown"),
  );
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

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export async function resourceFromLessonFile(file: File): Promise<Resource> {
  const type = lessonResourceTypeFromFile(file);
  if (!type) {
    throw new Error("Only PDF or Markdown (.md) files are supported.");
  }
  if (file.size > MAX_LESSON_FILE_BYTES) {
    throw new Error("File is too large (max 20 MB for this demo).");
  }

  const title = file.name.replace(/\.(pdf|md|markdown)$/i, "") || file.name;
  const id = `upload-${crypto.randomUUID().slice(0, 8)}`;

  if (type === "markdown") {
    const text = await readAsText(file);
    return {
      id,
      title,
      type,
      fileName: file.name,
      url: `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`,
    };
  }

  const url = await readAsDataUrl(file);
  return {
    id,
    title,
    type,
    fileName: file.name,
    url,
  };
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
