import { describe, it, expect } from "vitest";
import { generateGoals } from "../../src/lib/goals";
import { PROFESSION_TITLES } from "../../src/lib/orientation";
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

  // US9: карьерные цели должны генерироваться автоматически при выборе трека
  it("US9: every goal has title, horizon and rationale (required for auto-generation)", () => {
    for (const exp of [0, 12, 36, 72]) {
      const goals = generateGoals("Менеджер продукта", exp);
      for (const g of goals) {
        expect(g.title.length).toBeGreaterThan(0);
        expect(g.horizon.length).toBeGreaterThan(0);
        expect(g.rationale.length).toBeGreaterThan(0);
      }
    }
  });

  it("US9: goals include 1-year horizon for beginners", () => {
    const goals = generateGoals("UX/UI-дизайнер", 0);
    expect(goals.some((g) => g.horizon.includes("6") || g.horizon.includes("12"))).toBe(true);
  });

  it("US9: generates goals for all known profession slugs via PROFESSION_TITLES", () => {
    for (const title of Object.values(PROFESSION_TITLES) as string[]) {
      const goals = generateGoals(title, 0);
      expect(goals.length).toBeGreaterThanOrEqual(2);
    }
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
