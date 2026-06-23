import { describe, it, expect } from "vitest";
import { evaluateAlignment, ALIGNMENT_QUESTIONS } from "../../src/lib/job-alignment";
import { computeBadges, buildReminders } from "../../src/lib/motivation";

describe("evaluateAlignment", () => {
  it("scores high when all answers are 5", () => {
    const answers = Object.fromEntries(ALIGNMENT_QUESTIONS.map((q) => [q.id, 5]));
    const r = evaluateAlignment(answers, "Middle", "Frontend-разработчик");
    expect(r.score).toBe(100);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("scores low when all answers are 1", () => {
    const answers = Object.fromEntries(ALIGNMENT_QUESTIONS.map((q) => [q.id, 1]));
    const r = evaluateAlignment(answers);
    expect(r.score).toBe(20);
    expect(r.summary).toMatch(/расхождение/i);
  });
});

describe("motivation", () => {
  it("awards badges based on progress", () => {
    const badges = computeBadges({
      streakDays: 7,
      roadmapProgress: 100,
      testsPassed: 2,
      orientationDone: true,
      goalsSet: true,
    });
    const earned = badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned).toContain("streak-7");
    expect(earned).toContain("track-done");
  });

  it("builds reminders when goals missing", () => {
    const r = buildReminders({
      visitedToday: false,
      roadmapProgress: 10,
      hasRoadmap: true,
      lastTestDaysAgo: 20,
      goalsSet: false,
    });
    expect(r.some((x) => x.type === "goals")).toBe(true);
  });
});
