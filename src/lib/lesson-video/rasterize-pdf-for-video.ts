import type { Resource } from "@/lib/types";
import { MAX_VIDEO_PDF_PAGES } from "@/lib/generated-video/types";
import {
  loadPdfJs,
  pdfBytesFromResource,
  textFromPdfPage,
} from "@/lib/lesson-video/pdf-utils";

export type RasterizedPdfPage = {
  pageNum: number;
  /** data:image/jpeg;base64,... */
  imageDataUrl: string;
  text: string;
};

export type RasterizePdfResult = {
  pages: RasterizedPdfPage[];
  totalPages: number;
  truncated: boolean;
};

/**
 * Rasterize a PDF resource for the HeyGen pipeline (browser-only).
 * Caps at MAX_VIDEO_PDF_PAGES.
 */
export async function rasterizePdfForVideo(
  resource: Resource,
  maxPages = MAX_VIDEO_PDF_PAGES,
): Promise<RasterizePdfResult> {
  if (typeof window === "undefined") {
    return { pages: [], totalPages: 0, truncated: false };
  }

  const data = await pdfBytesFromResource(resource);
  if (!data) {
    throw new Error("Could not load PDF bytes.");
  }

  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const totalPages = pdf.numPages;
  const limit = Math.min(totalPages, maxPages);
  const pages: RasterizedPdfPage[] = [];

  for (let pageNum = 1; pageNum <= limit; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const textContent = await page.getTextContent();
    const text = textFromPdfPage(textContent.items as { str?: string }[]);

    pages.push({
      pageNum,
      imageDataUrl,
      text: text.trim(),
    });
  }

  return {
    pages,
    totalPages,
    truncated: totalPages > maxPages,
  };
}
