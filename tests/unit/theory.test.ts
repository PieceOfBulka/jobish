import { describe, it, expect } from "vitest";
import {
  gradeAttempt,
  canRetake,
  freezeRemainingMs,
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

  it("passes at or above threshold and does not freeze", () => {
    const r = gradeAttempt(answers(7, 10));
    expect(PASS_THRESHOLD).toBe(70);
    expect(r.passed).toBe(true);
    expect(r.frozenUntil).toBeNull();
  });

  it("fails below threshold and sets a future freeze", () => {
    const now = new Date("2026-06-03T10:00:00Z");
    const r = gradeAttempt(answers(2, 10), now);
    expect(r.passed).toBe(false);
    expect(r.frozenUntil).not.toBeNull();
    expect(r.frozenUntil!.getTime()).toBeGreaterThan(now.getTime());
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

describe("canRetake", () => {
  const now = new Date("2026-06-03T10:00:00Z");

  it("allows retake when not frozen", () => {
    expect(canRetake(null, 0, now)).toBe(true);
  });

  it("blocks retake while frozen with no extra tries", () => {
    const future = new Date(now.getTime() + 3600_000);
    expect(canRetake(future, 0, now)).toBe(false);
  });

  it("allows retake while frozen if extra tries available", () => {
    const future = new Date(now.getTime() + 3600_000);
    expect(canRetake(future, 1, now)).toBe(true);
  });

  it("allows retake once freeze has passed", () => {
    const past = new Date(now.getTime() - 1000);
    expect(canRetake(past, 0, now)).toBe(true);
  });
});

describe("freezeRemainingMs", () => {
  const now = new Date("2026-06-03T10:00:00Z");
  it("is zero when not frozen", () => {
    expect(freezeRemainingMs(null, now)).toBe(0);
  });
  it("returns positive remaining time when frozen", () => {
    const future = new Date(now.getTime() + 5000);
    expect(freezeRemainingMs(future, now)).toBe(5000);
  });
});
