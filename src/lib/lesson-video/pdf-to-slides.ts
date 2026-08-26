import type { Resource } from "@/lib/types";
import type { Slide } from "@/lib/lesson-video/types";
import {
  loadPdfJs,
  pdfBytesFromResource,
  textFromPdfPage,
} from "@/lib/lesson-video/pdf-utils";

export async function pdfResourceToSlides(resource: Resource): Promise<Slide[]> {
  if (typeof window === "undefined") return [];

  const data = await pdfBytesFromResource(resource);
  if (!data) return [];

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const slides: Slide[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.4 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const imageSrc = canvas.toDataURL("image/jpeg", 0.85);

    const textContent = await page.getTextContent();
    const bodyText = textFromPdfPage(textContent.items as { str?: string }[]);
    const title = `${resource.title} — page ${pageNum}`;

    slides.push({
      id: `${resource.id}-pdf-${pageNum}`,
      kind: "pdf",
      title,
      bodyText: bodyText || `Page ${pageNum} of ${resource.title}`,
      visual: {
        type: "image",
        src: imageSrc,
        alt: title,
      },
      sourceResourceId: resource.id,
    });
  }

  return slides;
}
