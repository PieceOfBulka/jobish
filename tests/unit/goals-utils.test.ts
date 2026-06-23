import { describe, it, expect } from "vitest";
import { generateGoals } from "../../src/lib/goals";
import { formatRub, pluralRu } from "../../src/lib/utils";

const baseCtx = {
  professionTitle: "Frontend-разработчик",
  experienceMonths: 6,
  roadmapDone: 0,
  roadmapTotal: 12,
  inProgressSkills: [] as string[],
  weakTopics: [] as string[],
};

describe("generateGoals", () => {
  it("creates beginner-oriented goals for low experience", () => {
    const goals = generateGoals(baseCtx);
    expect(goals).toHaveLength(4);
    expect(goals[0].title).toMatch(/Junior|стек|карту/i);
    expect(goals.some((g) => g.title.includes("Frontend-разработчик"))).toBe(true);
  });

  it("creates growth-oriented goals for experienced users", () => {
    const goals = generateGoals({
      ...baseCtx,
      professionTitle: "Аналитик данных",
      experienceMonths: 60,
      roadmapDone: 4,
      roadmapTotal: 15,
    });
    expect(goals[0].title).toMatch(/Middle|грейд|пробелы/i);
  });

  it("adapts short-term goal when roadmap progress is high", () => {
    const goals = generateGoals({
      ...baseCtx,
      roadmapDone: 11,
      roadmapTotal: 12,
    });
    expect(goals[0].title).toMatch(/собеседован|mock|пробелы/i);
    expect(goals[0].rationale).toMatch(/91%|11\/12/);
  });

  it("rotates wording on refresh variant", () => {
    const a = generateGoals({ ...baseCtx, variant: 0 });
    const b = generateGoals({ ...baseCtx, variant: 1 });
    expect(a[0].title).not.toBe(b[0].title);
  });

  it("includes weak topics in rationale when provided", () => {
    const goals = generateGoals({
      ...baseCtx,
      roadmapDone: 6,
      roadmapTotal: 12,
      weakTopics: ["TypeScript", "Тестирование"],
      variant: 2,
    });
    expect(goals[0].rationale + goals[0].title).toMatch(/TypeScript|Тестирование/);
  });

  it("always includes a habit goal", () => {
    const goals = generateGoals({ ...baseCtx, experienceMonths: 36, variant: 0 });
    expect(goals.some((g) => g.horizon === "постоянно")).toBe(true);
  });
});

describe("formatRub", () => {
  it("formats with thousands separators and ruble sign", () => {
    expect(formatRub(180000)).toMatch(/180\s?000\s?₽/);
  });
});

describe("pluralRu", () => {
  const forms: [string, string, string] = ["день", "дня", "дней"];
  it("picks correct plural form", () => {
    expect(pluralRu(1, forms)).toBe("день");
    expect(pluralRu(2, forms)).toBe("дня");
    expect(pluralRu(5, forms)).toBe("дней");
    expect(pluralRu(11, forms)).toBe("дней");
    expect(pluralRu(21, forms)).toBe("день");
  });
});
