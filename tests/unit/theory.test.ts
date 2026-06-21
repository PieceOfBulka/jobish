import { describe, it, expect } from "vitest";
import {
  gradeAttempt,
  canRetake,
  freezeRemainingMs,
  buildConclusion,
  scoreMultiple,
  PASS_THRESHOLD,
  type GradedAnswer,
} from "../../src/lib/theory";

function answers(correctCount: number, total: number, topic = "T"): GradedAnswer[] {
  return Array.from({ length: total }, (_, i) => ({
    questionId: `q${i}`,
    topic,
    weight: 1,
    points: i < correctCount ? 1 : 0,
    scoreable: true,
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
      { questionId: "1", topic: "SQL", weight: 1, points: 1, scoreable: true },
      { questionId: "2", topic: "SQL", weight: 1, points: 1, scoreable: true },
      { questionId: "3", topic: "Stats", weight: 1, points: 0, scoreable: true },
      { questionId: "4", topic: "Stats", weight: 1, points: 0, scoreable: true },
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

  it("ignores non-scoreable answers (scale/text) in percentage", () => {
    const mixed: GradedAnswer[] = [
      { questionId: "1", topic: "T", weight: 1, points: 1, scoreable: true },
      { questionId: "2", topic: "T", weight: 1, points: 0, scoreable: true },
      // scale question — excluded from score
      { questionId: "3", topic: "T", weight: 1, points: 0, scoreable: false },
    ];
    const r = gradeAttempt(mixed);
    expect(r.score).toBe(50); // only 2 scoreable questions
  });

  it("respects custom question weights", () => {
    const weighted: GradedAnswer[] = [
      { questionId: "1", topic: "T", weight: 2, points: 2, scoreable: true }, // full
      { questionId: "2", topic: "T", weight: 1, points: 0, scoreable: true }, // wrong
    ];
    const r = gradeAttempt(weighted);
    expect(r.score).toBe(67); // 2/3 * 100 rounded
  });
});

describe("scoreMultiple", () => {
  it("awards full weight for exact match", () => {
    expect(scoreMultiple([0, 2], [0, 2], 4, 1)).toBe(1);
  });

  it("awards partial credit for partial correct selection", () => {
    const score = scoreMultiple([0], [0, 2], 4, 1);
    // correctSelected=1, correctSet=2 → 0.5 * 1 = 0.5; wrongSelected=0 → 0.5
    expect(score).toBeCloseTo(0.5);
  });

  it("deducts for wrong selections", () => {
    const score = scoreMultiple([0, 1], [0, 2], 4, 1);
    // correctSelected=1/2 → 0.5; wrongSelected=1/4 → -0.25 → 0.25
    expect(score).toBeCloseTo(0.25);
  });

  it("clamps to 0 for all-wrong selection", () => {
    expect(scoreMultiple([1, 3], [0, 2], 4, 1)).toBe(0);
  });

  it("scales with weight", () => {
    expect(scoreMultiple([0, 2], [0, 2], 4, 2)).toBe(2);
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
