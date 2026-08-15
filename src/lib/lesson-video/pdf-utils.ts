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

export async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!workerConfigured && typeof window !== "undefined") {
    // Match installed package version; unpkg serves the worker for the browser.
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    workerConfigured = true;
  }
  return pdfjs;
}

/** Extract plain text from an uploaded PDF resource (data URL or remote Storage URL). */
export async function extractPdfText(resource: Resource): Promise<string> {
  if (typeof window === "undefined") return "";
  if (resource.type !== "pdf") return "";

  const pdfjs = await loadPdfJs();
  let data: Uint8Array;
  if (resource.url.startsWith("data:")) {
    data = dataUrlToUint8Array(resource.url);
  } else if (resource.url.startsWith("http://") || resource.url.startsWith("https://")) {
    const res = await fetch(resource.url);
    if (!res.ok) return "";
    data = new Uint8Array(await res.arrayBuffer());
  } else {
    return "";
  }

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
