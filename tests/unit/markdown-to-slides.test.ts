import { describe, expect, it } from "vitest";
import {
  markdownResourceToSlides,
  markdownToPlainText,
} from "@/lib/lesson-video/markdown-to-slides";
import type { Resource } from "@/lib/types";

function mdResource(text: string): Resource {
  return {
    id: "md-1",
    title: "Deck",
    type: "markdown",
    url: `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`,
  };
}

describe("markdown-to-slides", () => {
  it("strips light markdown for plain text", () => {
    expect(markdownToPlainText("**Bold** and [link](https://x)")).toBe("Bold and link");
  });

  it("returns empty slides for empty markdown", () => {
    expect(markdownResourceToSlides(mdResource("   "))).toEqual([]);
  });

  it("splits on ## headings into slides", () => {
    const slides = markdownResourceToSlides(
      mdResource(`# Root\n\n## First\n\nAlpha content here.\n\n## Second\n\nBeta content here.`),
    );
    expect(slides.length).toBeGreaterThanOrEqual(2);
    expect(slides.map((s) => s.title)).toEqual(expect.arrayContaining(["First", "Second"]));
    expect(slides.every((s) => s.kind === "markdown")).toBe(true);
  });
});
