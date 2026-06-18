import { describe, it, expect } from "vitest";
import { generateGoals } from "../../src/lib/goals";
import { formatRub, pluralRu } from "../../src/lib/utils";

describe("generateGoals", () => {
  it("creates beginner-oriented goals for low experience (<24 months)", () => {
    const goals = generateGoals("Frontend-разработчик", 6);
    expect(goals.length).toBeGreaterThanOrEqual(2);
    expect(goals[0].title).toMatch(/Junior/i);
    expect(goals.some((g) => g.title.includes("Frontend-разработчик"))).toBe(true);
  });

  it("creates growth-oriented goals for experienced users (>=24 months)", () => {
    const goals = generateGoals("Аналитик данных", 60);
    expect(goals[0].title).toMatch(/Middle|Senior/i);
  });

  it("always includes a habit goal", () => {
    const goals = generateGoals("QA-инженер", 36);
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
