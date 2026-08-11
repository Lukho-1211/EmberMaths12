"use client";

import { useMemo } from "react";
import { decodeMarkdownResource } from "@/lib/lesson-file";
import type { Resource } from "@/lib/types";

export function MarkdownPreview({
  resource,
  className,
}: {
  resource: Resource;
  /** Optional class on the outer article (e.g. taller scroll for main lesson text). */
  className?: string;
}) {
  const text = useMemo(() => decodeMarkdownResource(resource.url), [resource.url]);
  if (!text) {
    return (
      <a
        href={resource.url}
        download={resource.fileName ?? `${resource.title}.md`}
        className="text-sm font-medium text-ember-navy underline decoration-ember-gold"
      >
        Download {resource.title}
      </a>
    );
  }
  return (
    <article
      className={
        className ?? "rounded-lg border border-border bg-surface/50 p-3"
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Markdown</p>
        <a
          href={resource.url}
          download={resource.fileName ?? `${resource.title}.md`}
          className="text-xs font-semibold text-ember-navy underline decoration-ember-gold"
        >
          Download
        </a>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-ember-navy">
        {text}
      </pre>
    </article>
  );
}
