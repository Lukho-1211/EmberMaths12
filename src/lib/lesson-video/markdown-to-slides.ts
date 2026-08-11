import { decodeMarkdownResource } from "@/lib/lesson-file";
import type { Resource } from "@/lib/types";
import type { Slide } from "@/lib/lesson-video/types";

const CHUNK_CHARS = 800;

/** Strip light markdown so TTS reads cleanly. */
export function markdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkByParagraphs(text: string, maxChars: number): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return text.trim() ? [text.trim()] : [];

  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    if (!current) {
      current = p;
      continue;
    }
    if (current.length + 2 + p.length <= maxChars) {
      current = `${current}\n\n${p}`;
    } else {
      chunks.push(current);
      current = p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitOnH2(md: string): { title?: string; body: string }[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const sections: { title?: string; body: string }[] = [];
  let title: string | undefined;
  let bodyLines: string[] = [];

  const flush = () => {
    const body = bodyLines.join("\n").trim();
    if (title !== undefined || body) {
      sections.push({ title, body });
    }
    title = undefined;
    bodyLines = [];
  };

  for (const line of lines) {
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      flush();
      title = h2[1].trim();
      continue;
    }
    bodyLines.push(line);
  }
  flush();
  return sections;
}

export function markdownResourceToSlides(resource: Resource): Slide[] {
  const raw = decodeMarkdownResource(resource.url);
  if (!raw?.trim()) return [];

  const h1 = /^#\s+(.+)$/m.exec(raw);
  const docTitle = h1?.[1]?.trim() || resource.title;

  let sections = splitOnH2(raw);
  const hasNamedSections = sections.some((s) => s.title);

  if (!hasNamedSections) {
    const plainChunks = chunkByParagraphs(raw.trim(), CHUNK_CHARS);
    sections = plainChunks.map((body) => ({ body }));
  }

  const slides: Slide[] = [];
  sections.forEach((section, i) => {
    const displayMd = section.title
      ? `## ${section.title}\n\n${section.body}`.trim()
      : section.body || raw;
    const plain = markdownToPlainText(
      [section.title, section.body].filter(Boolean).join(". "),
    );
    if (!plain && section.body.trim() === "" && !section.title) return;

    const chunkBodies =
      plain.length > CHUNK_CHARS * 1.5 && !section.title
        ? chunkByParagraphs(section.body || raw, CHUNK_CHARS)
        : [section.body];

    if (chunkBodies.length > 1 && !section.title) {
      chunkBodies.forEach((body, j) => {
        const bodyText = markdownToPlainText(body);
        slides.push({
          id: `${resource.id}-md-${i}-${j}`,
          kind: "markdown",
          title: j === 0 ? docTitle : `${docTitle} (${j + 1})`,
          bodyText: bodyText || docTitle,
          visual: { type: "text", markdown: body },
          sourceResourceId: resource.id,
        });
      });
      return;
    }

    slides.push({
      id: `${resource.id}-md-${i}`,
      kind: "markdown",
      title: section.title ?? docTitle,
      bodyText: plain || section.title || docTitle,
      visual: { type: "text", markdown: displayMd },
      sourceResourceId: resource.id,
    });
  });

  return slides;
}
