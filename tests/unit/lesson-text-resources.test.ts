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
  it("returns uploaded markdown then PDFs and skips placeholders", () => {
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
    expect(result.map((r) => r.id)).toEqual(["m1", "p1"]);
  });

  it("includes data-URL markdown from seed", () => {
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent("# Hello")}`;
    const result = lessonTextResources(
      lesson([{ id: "m0", title: "Seed", type: "markdown", url }]),
    );
    expect(result).toHaveLength(1);
    expect(primaryLessonMarkdownResource(lesson([{ id: "m0", title: "Seed", type: "markdown", url }]))?.id).toBe(
      "m0",
    );
  });

  it("returns empty when only placeholders exist", () => {
    expect(
      lessonTextResources(
        lesson([{ id: "p0", title: "Stub", type: "pdf", url: "#" }]),
      ),
    ).toEqual([]);
  });
});
