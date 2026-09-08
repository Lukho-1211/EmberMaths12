import { describe, expect, it } from "vitest";
import { clampScore, parseGradeResponse } from "@/lib/grade-week-test-scan";

describe("clampScore", () => {
  it("rounds and clamps to 0–100", () => {
    expect(clampScore(72.4)).toBe(72);
    expect(clampScore(72.6)).toBe(73);
    expect(clampScore(-5)).toBe(0);
    expect(clampScore(140)).toBe(100);
    expect(clampScore("88")).toBe(88);
    expect(clampScore("nope")).toBe(0);
    expect(clampScore(undefined)).toBe(0);
  });
});

describe("parseGradeResponse", () => {
  it("parses a valid Gemini-shaped payload", () => {
    const result = parseGradeResponse(
      {
        score: 67.2,
        summary: "Solid algebra; revisit trig identities.",
        feedback: ["Good method on Q1.", "  ", "Show reasons on Q3."],
        questionFeedback: [
          {
            questionId: "q1",
            prompt: "Solve for x",
            correct: true,
            note: "Clear working.",
          },
          {
            questionId: "q2",
            prompt: "Prove triangle ABC",
            correct: false,
            note: "Missing key reason.",
          },
        ],
      },
      50,
    );

    expect(result.score).toBe(67);
    expect(result.summary).toContain("Solid algebra");
    expect(result.feedback).toEqual(["Good method on Q1.", "Show reasons on Q3."]);
    expect(result.questionFeedback).toHaveLength(2);
    expect(result.questionFeedback[0]?.correct).toBe(true);
    expect(result.questionFeedback[1]?.note).toContain("Missing");
  });

  it("fills defaults when fields are missing", () => {
    const result = parseGradeResponse({ score: 40 }, 50);
    expect(result.score).toBe(40);
    expect(result.summary.toLowerCase()).toContain("pass");
    expect(result.feedback.length).toBeGreaterThan(0);
    expect(result.questionFeedback).toEqual([]);
  });

  it("throws on empty response", () => {
    expect(() => parseGradeResponse(null, 50)).toThrow(/empty/i);
    expect(() => parseGradeResponse("oops", 50)).toThrow(/empty/i);
  });
});
