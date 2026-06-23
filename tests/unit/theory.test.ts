import { describe, it, expect } from "vitest";
import {
  gradeAttempt,
  buildConclusion,
  PASS_THRESHOLD,
  type GradedAnswer,
} from "../../src/lib/theory";

function answers(correctCount: number, total: number, topic = "T"): GradedAnswer[] {
  return Array.from({ length: total }, (_, i) => ({
    questionId: `q${i}`,
    topic,
    correct: i < correctCount,
  }));
}

describe("gradeAttempt", () => {
  it("computes score as percentage", () => {
    const r = gradeAttempt(answers(3, 4));
    expect(r.score).toBe(75);
  });

  it("passes at or above threshold", () => {
    const r = gradeAttempt(answers(7, 10));
    expect(PASS_THRESHOLD).toBe(70);
    expect(r.passed).toBe(true);
  });

  it("fails below threshold", () => {
    const r = gradeAttempt(answers(2, 10));
    expect(r.passed).toBe(false);
  });

  it("splits weak and strong topics", () => {
    const mixed: GradedAnswer[] = [
      { questionId: "1", topic: "SQL", correct: true },
      { questionId: "2", topic: "SQL", correct: true },
      { questionId: "3", topic: "Stats", correct: false },
      { questionId: "4", topic: "Stats", correct: false },
    ];
    const r = gradeAttempt(mixed);
    expect(r.strongTopics).toContain("SQL");
    expect(r.weakTopics).toContain("Stats");
  });

  it("handles empty input", () => {
    const r = gradeAttempt([]);
    expect(r.score).toBe(0);
    expect(r.passed).toBe(false);
  });
});

describe("buildConclusion (ФТ-2.4)", () => {
  it("praises a clean pass", () => {
    const c = buildConclusion(100, true, []);
    expect(c).toMatch(/100%/);
    expect(c).toMatch(/дальше|уверенно/i);
  });
  it("mentions weak topics on a pass with gaps", () => {
    const c = buildConclusion(80, true, ["SQL"]);
    expect(c).toMatch(/SQL/);
  });
  it("focuses on weak topics on a fail", () => {
    const c = buildConclusion(40, false, ["CSS", "JS"]);
    expect(c).toMatch(/CSS/);
    expect(c).toMatch(/40%/);
  });
});
