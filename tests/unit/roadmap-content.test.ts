import { describe, it, expect } from "vitest";
import {
  GRADE_STAGES,
  stageDescription,
  stepHint,
  estimateForSkill,
  type Grade,
} from "../../src/lib/roadmap-content";

describe("GRADE_STAGES", () => {
  it("covers three grades in order junior→middle→senior", () => {
    expect(GRADE_STAGES.map((s) => s.key)).toEqual(["junior", "middle", "senior"]);
    for (const s of GRADE_STAGES) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.outcome.length).toBeGreaterThan(0);
    }
  });
});

describe("stageDescription", () => {
  it("lists the stage skills and the outcome", () => {
    const d = stageDescription("junior", "Frontend-разработчик", ["HTML и CSS", "JavaScript"]);
    expect(d).toContain("HTML и CSS");
    expect(d).toContain("JavaScript");
    expect(d).toContain("junior"); // outcome упоминает junior-позицию
  });

  it("falls back gracefully when no skills are provided", () => {
    const d = stageDescription("middle", "Аналитик данных", []);
    expect(d).toContain("Аналитик данных");
    expect(d.length).toBeGreaterThan(0);
  });
});

describe("stepHint", () => {
  it("distinguishes soft from hard skills", () => {
    expect(stepHint("soft", "junior")).toMatch(/Гибкий навык/);
    expect(stepHint("hard", "junior")).toMatch(/технический/);
  });

  it("treats unknown type as technical and never returns empty", () => {
    for (const g of ["junior", "middle", "senior"] as Grade[]) {
      expect(stepHint(null, g).length).toBeGreaterThan(0);
    }
  });
});

describe("estimateForSkill", () => {
  it("grows with grade and is higher for hard skills", () => {
    expect(estimateForSkill("hard", "junior")).toBeLessThan(estimateForSkill("hard", "senior"));
    expect(estimateForSkill("soft", "middle")).toBeLessThan(estimateForSkill("hard", "middle"));
    expect(estimateForSkill("hard", "junior")).toBeGreaterThan(0);
  });
});
