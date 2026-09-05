import type { Resource } from "@/lib/types";

export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) throw new Error("Invalid PDF data URL.");
  const meta = dataUrl.slice(0, comma);
  const data = dataUrl.slice(comma + 1);
  if (meta.includes(";base64")) {
    const binary = atob(data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const decoded = decodeURIComponent(data);
  return new TextEncoder().encode(decoded);
}

export function textFromPdfPage(items: { str?: string }[]): string {
  return items
    .map((item) => item.str ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

let workerConfigured = false;

/**
 * Load PDF.js legacy build (polyfills Map.getOrInsertComputed etc. for school browsers).
 * Modern pdfjs-dist requires Chrome/Edge 145+, Firefox 144+, Safari 26.2+.
 * Worker is served from /public (copied from pdfjs-dist/legacy) — keep versions in sync.
 */
export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!workerConfigured && typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    workerConfigured = true;
  }
  return pdfjs;
}

/**
 * Load PDF bytes from a data URL or remote Storage / http(s) URL.
 * Returns null when the URL is a placeholder or fetch fails.
 */
export async function pdfBytesFromResource(
  resource: Resource,
): Promise<Uint8Array | null> {
  if (resource.type !== "pdf") return null;
  if (resource.url.startsWith("data:")) {
    try {
      return dataUrlToUint8Array(resource.url);
    } catch {
      return null;
    }
  }
  if (resource.url.startsWith("http://") || resource.url.startsWith("https://")) {
    try {
      const res = await fetch(resource.url);
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    } catch {
      return null;
    }
  }
  return null;
}

/** Extract plain text from an uploaded PDF resource (data URL or remote Storage URL). */
export async function extractPdfText(resource: Resource): Promise<string> {
  if (typeof window === "undefined") return "";
  if (resource.type !== "pdf") return "";

  const data = await pdfBytesFromResource(resource);
  if (!data) return "";

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textFromPdfPage(textContent.items as { str?: string }[]);
    if (pageText) parts.push(pageText);
  }

  return parts.join("\n\n").trim();
}
