import { describe, expect, it } from "vitest";
import { meetsPassMark, scoreMcq } from "@/lib/score-mcq";

const questions = [
  {
    id: "q1",
    prompt: "1 + 1",
    options: ["1", "2", "3", "4"],
    answerIndex: 1,
  },
  {
    id: "q2",
    prompt: "2 + 2",
    options: ["2", "3", "4", "5"],
    answerIndex: 2,
  },
  {
    id: "q3",
    prompt: "3 + 3",
    options: ["4", "5", "6", "7"],
    answerIndex: 2,
  },
];

describe("scoreMcq", () => {
  it("scores all correct answers as 100", () => {
    expect(
      scoreMcq(questions, {
        q1: 1,
        q2: 2,
        q3: 2,
      }),
    ).toBe(100);
  });

  it("scores all wrong answers as 0", () => {
    expect(
      scoreMcq(questions, {
        q1: 0,
        q2: 0,
        q3: 0,
      }),
    ).toBe(0);
  });

  it("treats missing answers as wrong", () => {
    expect(scoreMcq(questions, {})).toBe(0);
    expect(scoreMcq(questions, { q1: 1 })).toBe(33);
  });

  it("rounds percent with Math.round (2 of 3 → 67)", () => {
    expect(
      scoreMcq(questions, {
        q1: 1,
        q2: 2,
        q3: 0,
      }),
    ).toBe(67);
  });

  it("returns 0 for an empty question bank", () => {
    expect(scoreMcq([], {})).toBe(0);
  });
});

describe("meetsPassMark", () => {
  it("passes when score equals the pass mark", () => {
    expect(meetsPassMark(50, 50)).toBe(true);
  });

  it("passes when score is above the pass mark", () => {
    expect(meetsPassMark(67, 50)).toBe(true);
  });

  it("fails when score is below the pass mark", () => {
    expect(meetsPassMark(49, 50)).toBe(false);
  });

  it("does not pass an empty-bank score of 0 against a normal pass mark", () => {
    expect(meetsPassMark(scoreMcq([], {}), 50)).toBe(false);
  });
});
