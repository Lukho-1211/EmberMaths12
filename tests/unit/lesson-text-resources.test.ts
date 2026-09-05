import { describe, expect, it } from "vitest";
import { lessonTextResources, primaryLessonMarkdownResource } from "@/lib/lesson-file";
import type { Lesson } from "@/lib/types";

function lesson(resources: Lesson["resources"]): Lesson {
  return {
    id: "l1",
    day: "monday",
    title: "Test",
    description: "Desc",
    videoUrl: "https://example.com",
    durationMinutes: 30,
    resources,
  };
}

describe("lessonTextResources", () => {
  it("returns uploaded PDFs only and skips markdown and placeholders", () => {
    const result = lessonTextResources(
      lesson([
        { id: "p0", title: "Stub", type: "pdf", url: "#" },
        {
          id: "m1",
          title: "Notes",
          type: "markdown",
          url: "https://example.com/notes.md",
        },
        {
          id: "p1",
          title: "Scan",
          type: "pdf",
          url: "https://example.com/scan.pdf",
        },
        { id: "l1", title: "Link", type: "link", url: "https://example.com" },
      ]),
    );
    expect(result.map((r) => r.id)).toEqual(["p1"]);
  });

  it("returns empty for markdown-only lessons; primaryLessonMarkdownResource still finds it", () => {
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent("# Hello")}`;
    const mdLesson = lesson([{ id: "m0", title: "Seed", type: "markdown", url }]);
    expect(lessonTextResources(mdLesson)).toEqual([]);
    expect(primaryLessonMarkdownResource(mdLesson)?.id).toBe("m0");
  });

  it("returns empty when only placeholders exist", () => {
    expect(
      lessonTextResources(
        lesson([{ id: "p0", title: "Stub", type: "pdf", url: "#" }]),
      ),
    ).toEqual([]);
  });
});
