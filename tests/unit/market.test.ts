import { describe, it, expect } from "vitest";
import { formatMarketContext, formatDemandLevel } from "../../src/lib/market";

describe("formatDemandLevel", () => {
  it("normalizes legacy feminine forms to masculine", () => {
    expect(formatDemandLevel("средняя")).toBe("средний");
    expect(formatDemandLevel("высокий")).toBe("высокий");
  });
});

describe("formatMarketContext", () => {
  const m = {
    title: "Frontend-разработчик",
    demandLevel: "высокая",
    openVacancies: 12400,
    salaryJunior: 80000,
    salaryMiddle: 180000,
    salarySenior: 320000,
    topCompanies: [{ name: "Яндекс" }, { name: "VK" }, { name: "Тинькофф" }, { name: "Ozon" }],
  };

  it("includes grade salaries with concrete numbers", () => {
    const t = formatMarketContext(m);
    expect(t).toMatch(/junior/i);
    expect(t).toMatch(/180\s?000/);
    expect(t).toMatch(/320\s?000/);
  });

  it("includes demand, vacancies and up to 3 companies", () => {
    const t = formatMarketContext(m);
    expect(t).toMatch(/спрос высокий/);
    expect(t).toMatch(/12\s?400/);
    expect(t).toMatch(/Яндекс, VK, Тинькофф/);
    expect(t).not.toMatch(/Ozon/); // только топ-3
  });
});
