import { describe, expect, it } from "vitest";
import { generateLessonTestFromResources } from "@/lib/generate-lesson-mcqs";
import type { Resource } from "@/lib/types";

function markdownResource(text: string): Resource {
  return {
    id: "res-md-1",
    title: "Lesson notes",
    type: "markdown",
    fileName: "notes.md",
    url: `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`,
  };
}

const RICH_MARKDOWN = `
# Quadratic equations

Learners solve quadratic equations using factorisation when the leading coefficient is one.
The discriminant tells us how many real roots a quadratic equation has in CAPS Grade 12.
Completing the square rewrites a quadratic so the vertex form becomes clear for graphing.
The quadratic formula is used when factorisation is awkward or coefficients are messy.
Sketching the parabola helps learners check intercepts and the axis of symmetry quickly.
Revision should include mixed word problems that translate into quadratic equations.
`.trim();

describe("generateLessonTestFromResources", () => {
  it("builds MCQs with valid answerIndex from markdown", async () => {
    const test = await generateLessonTestFromResources({
      lesson: { id: "lesson-1", title: "Quadratics", day: "monday" },
      resources: [markdownResource(RICH_MARKDOWN)],
    });

    expect(test).not.toBeNull();
    expect(test!.questions.length).toBeGreaterThanOrEqual(3);
    expect(test!.questions.length).toBeLessThanOrEqual(5);
    for (const q of test!.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(q.options.length);
    }
  });

  it("returns null when text is too short to yield snippets", async () => {
    const test = await generateLessonTestFromResources({
      lesson: { id: "lesson-2", title: "Tiny", day: "tuesday" },
      resources: [markdownResource("Hi")],
    });
    expect(test).toBeNull();
  });

  it("is deterministic for the same inputs", async () => {
    const args = {
      lesson: { id: "lesson-1", title: "Quadratics", day: "monday" as const },
      resources: [markdownResource(RICH_MARKDOWN)],
    };
    const a = await generateLessonTestFromResources(args);
    const b = await generateLessonTestFromResources(args);
    expect(a).toEqual(b);
  });
});
