"use client";

import { useEffect, useState } from "react";
import {
  loadPdfJs,
  pdfBytesFromResource,
} from "@/lib/lesson-video/pdf-utils";
import type { Resource } from "@/lib/types";

type PageImage = {
  pageNum: number;
  src: string;
  alt: string;
};

async function renderPdfPages(resource: Resource): Promise<PageImage[]> {
  const data = await pdfBytesFromResource(resource);
  if (!data) throw new Error("Could not load PDF.");

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const pages: PageImage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    pages.push({
      pageNum,
      src: canvas.toDataURL("image/jpeg", 0.9),
      alt: `${resource.title} — page ${pageNum}`,
    });
  }

  return pages;
}

export function PdfNotesPreview({
  resource,
  className,
}: {
  resource: Resource;
  /** Optional class on the outer article (e.g. main lesson text shell). */
  className?: string;
}) {
  return (
    <PdfNotesPreviewInner
      key={`${resource.id}:${resource.url}`}
      resource={resource}
      className={className}
    />
  );
}

function PdfNotesPreviewInner({
  resource,
  className,
}: {
  resource: Resource;
  className?: string;
}) {
  const [pages, setPages] = useState<PageImage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void renderPdfPages(resource)
      .then((next) => {
        if (!cancelled) setPages(next);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not preview PDF.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [resource.id, resource.url]);

  const shellClass =
    className ?? "rounded-lg border border-border bg-surface/50 p-3";

  const downloadLink = (
    <a
      href={resource.url}
      download={resource.fileName ?? `${resource.title}.pdf`}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold text-ember-navy underline decoration-ember-gold"
    >
      Download
    </a>
  );

  if (error) {
    return (
      <article className={shellClass}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">PDF</p>
          {downloadLink}
        </div>
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
        <a
          href={resource.url}
          download={resource.fileName ?? `${resource.title}.pdf`}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-medium text-ember-navy underline decoration-ember-gold"
        >
          Open {resource.title}
        </a>
      </article>
    );
  }

  if (!pages) {
    return (
      <article className={shellClass}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">PDF</p>
          {downloadLink}
        </div>
        <p className="text-sm text-muted">Loading notes…</p>
      </article>
    );
  }

  return (
    <article className={shellClass}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          PDF · {resource.title}
        </p>
        {downloadLink}
      </div>
      <div className="max-h-[32rem] space-y-4 overflow-auto">
        {pages.map((page) => (
          // eslint-disable-next-line @next/next/no-img-element -- canvas-rendered page JPEG
          <img
            key={`${resource.id}-page-${page.pageNum}`}
            src={page.src}
            alt={page.alt}
            className="w-full rounded-md border border-border bg-white"
          />
        ))}
      </div>
    </article>
  );
}
