import { describe, it, expect } from "vitest";
import {
  percentile,
  salarySummary,
  modelSalarySample,
} from "../../src/lib/salary-stats";

describe("percentile", () => {
  const data = [1, 2, 3, 4, 5];
  it("returns exact value at boundaries", () => {
    expect(percentile(data, 0)).toBe(1);
    expect(percentile(data, 1)).toBe(5);
  });
  it("interpolates the median", () => {
    expect(percentile(data, 0.5)).toBe(3);
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
  });
  it("handles single-element arrays", () => {
    expect(percentile([42], 0.9)).toBe(42);
  });
});

describe("salarySummary", () => {
  it("returns null for empty or non-positive input", () => {
    expect(salarySummary([])).toBeNull();
    expect(salarySummary([0, -100, NaN])).toBeNull();
  });
  it("computes ordered percentiles", () => {
    const s = salarySummary([100, 200, 300, 400, 500])!;
    expect(s.count).toBe(5);
    expect(s.min).toBe(100);
    expect(s.max).toBe(500);
    expect(s.median).toBe(300);
    expect(s.p25).toBeLessThanOrEqual(s.median);
    expect(s.p75).toBeGreaterThanOrEqual(s.median);
    expect(s.p90).toBeGreaterThanOrEqual(s.p75);
  });
  it("filters out invalid values before computing", () => {
    const s = salarySummary([100, 0, 200, NaN, 300])!;
    expect(s.count).toBe(3);
  });
});

describe("modelSalarySample", () => {
  it("produces a non-empty sample spanning junior..top", () => {
    const sample = modelSalarySample(80000, 180000, 320000);
    expect(sample.length).toBeGreaterThan(10);
    expect(Math.min(...sample)).toBe(80000);
    expect(Math.max(...sample)).toBeGreaterThanOrEqual(320000);
  });
  it("is deterministic", () => {
    expect(modelSalarySample(70000, 150000, 280000)).toEqual(
      modelSalarySample(70000, 150000, 280000),
    );
  });
  it("yields a median between junior and senior", () => {
    const s = salarySummary(modelSalarySample(80000, 180000, 320000))!;
    expect(s.median).toBeGreaterThan(80000);
    expect(s.median).toBeLessThan(320000);
  });
});
