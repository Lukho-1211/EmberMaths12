import type { Resource } from "@/lib/types";
import { markdownResourceToSlides } from "@/lib/lesson-video/markdown-to-slides";
import { pickVideoSources } from "@/lib/lesson-video/pick-sources";
import { pdfResourceToSlides } from "@/lib/lesson-video/pdf-to-slides";
import type { SlideDeck } from "@/lib/lesson-video/types";

/** ~words-per-minute for estimated duration; floor 1 minute. */
function estimateMinutes(totalChars: number, slideCount: number): number {
  const words = Math.max(1, Math.round(totalChars / 5));
  const fromSpeech = words / 140;
  const fromSlides = slideCount * 0.2;
  return Math.max(1, Math.round(Math.max(fromSpeech, fromSlides)));
}

export function resourcesCacheKey(resources: Resource[]): string {
  return pickVideoSources(resources)
    .map((r) => `${r.id}:${r.url.length}:${r.type}`)
    .join("|");
}

/**
 * Build a slide deck from uploaded PDF / Markdown resources (view-time conversion).
 * Returns null when there are no convertible uploads.
 */
export async function buildSlideDeck(resources: Resource[]): Promise<SlideDeck | null> {
  const sources = pickVideoSources(resources);
  if (sources.length === 0) return null;

  const slides = [];
  for (const resource of sources) {
    if (resource.type === "markdown") {
      slides.push(...markdownResourceToSlides(resource));
    } else if (resource.type === "pdf") {
      slides.push(...(await pdfResourceToSlides(resource)));
    }
  }

  if (slides.length === 0) return null;

  const totalChars = slides.reduce((n, s) => n + s.bodyText.length, 0);
  return {
    slides,
    estimatedMinutes: estimateMinutes(totalChars, slides.length),
  };
}
