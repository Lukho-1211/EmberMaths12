import { describe, expect, it } from "vitest";
import {
  clampScore,
  parseCorrectFlag,
  parseGradeResponse,
  questionHintsForPaperScan,
} from "@/lib/grade-week-test-scan";

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

  it("reads snake_case question_feedback and string correct flags", () => {
    const result = parseGradeResponse(
      {
        score: 40,
        summary: "Needs work on 1.1.",
        feedback: ["Show the mean."],
        question_feedback: [
          {
            question_id: "q1.1",
            prompt: "1.1 Find a and b",
            correct: "false",
            note: "b is wrong.",
          },
        ],
      },
      50,
    );
    expect(result.questionFeedback).toEqual([
      {
        questionId: "q1.1",
        prompt: "1.1 Find a and b",
        correct: false,
        note: "b is wrong.",
      },
    ]);
  });
});

describe("parseCorrectFlag", () => {
  it("does not treat the string false as true", () => {
    expect(parseCorrectFlag(true)).toBe(true);
    expect(parseCorrectFlag(false)).toBe(false);
    expect(parseCorrectFlag("false")).toBe(false);
    expect(parseCorrectFlag("true")).toBe(true);
    expect(parseCorrectFlag(0)).toBe(false);
  });
});

describe("questionHintsForPaperScan", () => {
  it("drops leftover seed Saturday MCQs", () => {
    expect(
      questionHintsForPaperScan([
        {
          id: "q-t1-w1-1",
          prompt: "Which statement best relates to Number Patterns & Sequences?",
        },
        {
          id: "q-t1-w1-2",
          prompt: "A learner should prepare for Saturday week tests by…",
        },
        { id: "real", prompt: "1.1 Determine the values of a and b." },
      ]),
    ).toEqual([{ id: "real", prompt: "1.1 Determine the values of a and b." }]);
  });

  it("returns empty when every prompt is a placeholder", () => {
    expect(
      questionHintsForPaperScan([
        {
          id: "q-t1-w1-3",
          prompt:
            "In the context of Number Patterns & Sequences, the next step after practice is…",
        },
      ]),
    ).toEqual([]);
  });
});
