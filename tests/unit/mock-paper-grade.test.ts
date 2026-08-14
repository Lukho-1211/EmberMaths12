import { describe, expect, it } from "vitest";
import { mockPaperGrade } from "@/lib/mock-paper-grade";

describe("mockPaperGrade", () => {
  const questions = [
    {
      id: "q1",
      prompt: "Solve x + 1 = 2",
      options: ["1", "2", "3", "4"],
      answerIndex: 0,
    },
    {
      id: "q2",
      prompt: "Derivative of x^2",
      options: ["2x", "x", "x^2", "2"],
      answerIndex: 0,
    },
  ];

  it("is deterministic for the same assessmentId and fileName", () => {
    const a = mockPaperGrade({
      assessmentId: "assess-1",
      assessmentTitle: "Paper A",
      questions,
      fileName: "scan.pdf",
      passMark: 50,
    });
    const b = mockPaperGrade({
      assessmentId: "assess-1",
      assessmentTitle: "Paper A",
      questions,
      fileName: "scan.pdf",
      passMark: 50,
    });
    expect(a).toEqual(b);
  });

  it("changes result when fileName changes", () => {
    const a = mockPaperGrade({
      assessmentId: "assess-1",
      assessmentTitle: "Paper A",
      questions,
      fileName: "scan-a.pdf",
      passMark: 50,
    });
    const b = mockPaperGrade({
      assessmentId: "assess-1",
      assessmentTitle: "Paper A",
      questions,
      fileName: "scan-b.pdf",
      passMark: 50,
    });
    expect(a.questionFeedback).not.toEqual(b.questionFeedback);
  });

  it("reports pass vs fail relative to passMark", () => {
    const result = mockPaperGrade({
      assessmentId: "assess-1",
      assessmentTitle: "Paper A",
      questions,
      fileName: "script.jpg",
      passMark: 50,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    const passLine = result.feedback.find((line) => line.startsWith("Overall:"));
    if (result.score >= 50) {
      expect(passLine).toMatch(/pass band/);
    } else {
      expect(passLine).toMatch(/below pass band/);
    }
  });

  it("falls back to generic prompts when question bank is empty", () => {
    const result = mockPaperGrade({
      assessmentId: "assess-empty",
      assessmentTitle: "Blank paper",
      questions: [],
      fileName: "blank.pdf",
      passMark: 50,
    });
    expect(result.questionFeedback.length).toBeGreaterThan(0);
    expect(result.questionFeedback[0]?.prompt).toMatch(/Question 1/);
  });
});
