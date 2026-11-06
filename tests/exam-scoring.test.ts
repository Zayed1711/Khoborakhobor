import { describe, expect, it } from "vitest";
import { isRight, scoreObjective } from "@/lib/exam/scoring";

const qs = [
  { id: "a", kind: "mcq", answer: "2", marks: 1 },
  { id: "b", kind: "tfng", answer: "NOT GIVEN", marks: 1 },
  { id: "c", kind: "blank", answer: "inflation / inflations", marks: 1 },
  { id: "d", kind: "mcq", answer: "0", marks: 1 },
  { id: "w", kind: "writing", answer: "", marks: 5 },
];

describe("weekly exam scoring", () => {
  it("+1 right, −0.5 wrong, 0 blank; writing not counted", () => {
    const s = scoreObjective(qs, { a: "2", b: "TRUE", c: " Inflation. ", w: "My essay" });
    expect(s).toEqual({ correct: 2, wrong: 1, negative: 0.5, objectiveScore: 1.5 });
  });

  it("typed answers ignore case, spaces and punctuation, and accept listed forms", () => {
    expect(isRight(qs[2], "INFLATIONS")).toBe(true);
    expect(isRight(qs[2], "deflation")).toBe(false);
    expect(isRight(qs[2], "   ")).toBe(null);
  });

  it("all blank scores zero with no negative", () => {
    expect(scoreObjective(qs, {})).toEqual({ correct: 0, wrong: 0, negative: 0, objectiveScore: 0 });
  });
});

import { rankMerit } from "@/lib/exam/scoring";

describe("merit list", () => {
  const row = (name: string, objectiveScore: number, writingMarks: number, timeTakenSec: number, negative = 0) => ({ studentId: name, name, objectiveScore, writingMarks, timeTakenSec, negative });

  it("ranks by total, then less time, then fewer negative marks", () => {
    const list = rankMerit([
      row("Rahim", 30, 6, 1800, 2), // 36, slowest of the 36s
      row("Karim", 34, 4, 2000, 1), // 38
      row("Sadia", 32, 4, 1500, 2), // 36, faster than Rahim
      row("Nila", 33, 3, 1500, 1), // 36, same time as Sadia, fewer negatives
    ]);
    expect(list.map((r) => r.name)).toEqual(["Karim", "Nila", "Sadia", "Rahim"]);
    expect(list.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(list[0].total).toBe(38);
  });
});
