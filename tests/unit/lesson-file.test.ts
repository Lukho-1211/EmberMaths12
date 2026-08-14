import { describe, expect, it } from "vitest";
import {
  decodeMarkdownResource,
  lessonResourceTypeFromFile,
  primaryLessonMarkdownResource,
} from "@/lib/lesson-file";
import type { Lesson } from "@/lib/types";

describe("lesson-file", () => {
  it("detects markdown and pdf file types", () => {
    expect(
      lessonResourceTypeFromFile(new File(["# hi"], "notes.md", { type: "text/markdown" })),
    ).toBe("markdown");
    expect(
      lessonResourceTypeFromFile(new File(["%PDF"], "paper.pdf", { type: "application/pdf" })),
    ).toBe("pdf");
    expect(
      lessonResourceTypeFromFile(new File(["x"], "image.png", { type: "image/png" })),
    ).toBeNull();
  });

  it("decodes percent-encoded markdown data URLs", () => {
    const md = "# Title\n\nHello world";
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
    expect(decodeMarkdownResource(url)).toBe(md);
  });

  it("returns null for non-markdown data URLs", () => {
    expect(decodeMarkdownResource("https://example.com/a.md")).toBeNull();
    expect(decodeMarkdownResource("data:application/pdf;base64,abc")).toBeNull();
  });

  it("finds the primary markdown resource on a lesson", () => {
    const lesson = {
      id: "l1",
      day: "monday",
      title: "Lesson",
      description: "",
      videoUrl: "",
      durationMinutes: 20,
      resources: [
        {
          id: "r1",
          title: "PDF",
          type: "pdf",
          url: "data:application/pdf;base64,abc",
        },
        {
          id: "r2",
          title: "Notes",
          type: "markdown",
          url: "data:text/markdown;charset=utf-8,hello",
        },
      ],
    } as Lesson;

    expect(primaryLessonMarkdownResource(lesson)?.id).toBe("r2");
  });
});
