import { describe, it, expect } from "vitest";
import { extractSalaries, hhSummaryText } from "../../src/lib/hh";

describe("extractSalaries", () => {
  it("collects RUR salary midpoints", () => {
    const items = [
      { salary: { from: 100000, to: 140000, currency: "RUR", gross: null } },
      { salary: null },
      { salary: { from: 2000, to: 3000, currency: "USD", gross: null } },
    ];
    expect(extractSalaries(items)).toEqual([120000]);
  });
});

describe("hhSummaryText", () => {
  it("includes count and median", () => {
    const t = hhSummaryText({
      query: "Аналитик данных",
      found: 532,
      medianSalary: 180000,
      samples: [],
    });
    expect(t).toMatch(/Аналитик данных/);
    expect(t).toMatch(/532/);
    expect(t).toMatch(/180\s?000/);
  });
});
