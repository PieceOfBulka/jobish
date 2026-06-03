import { describe, it, expect } from "vitest";
import { nextStreak, visitedToday } from "../../src/lib/streak";

describe("nextStreak", () => {
  const now = new Date("2026-06-03T12:00:00");

  it("starts at 1 with no prior visit", () => {
    expect(nextStreak(0, null, now)).toBe(1);
  });

  it("keeps streak on same-day visit", () => {
    const earlierToday = new Date("2026-06-03T08:00:00");
    expect(nextStreak(5, earlierToday, now)).toBe(5);
  });

  it("increments on consecutive day", () => {
    const yesterday = new Date("2026-06-02T20:00:00");
    expect(nextStreak(5, yesterday, now)).toBe(6);
  });

  it("resets after a gap", () => {
    const threeDaysAgo = new Date("2026-05-31T12:00:00");
    expect(nextStreak(5, threeDaysAgo, now)).toBe(1);
  });
});

describe("visitedToday", () => {
  const now = new Date("2026-06-03T12:00:00");
  it("false when never visited", () => {
    expect(visitedToday(null, now)).toBe(false);
  });
  it("true when visited earlier today", () => {
    expect(visitedToday(new Date("2026-06-03T01:00:00"), now)).toBe(true);
  });
  it("false when visited yesterday", () => {
    expect(visitedToday(new Date("2026-06-02T23:59:00"), now)).toBe(false);
  });
});
