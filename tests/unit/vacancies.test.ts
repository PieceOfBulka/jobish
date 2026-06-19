import { describe, it, expect } from "vitest";
import {
  filterVacancies,
  matchesVacancyFilter,
  type Vacancy,
} from "../../src/lib/vacancies";

const V: Vacancy[] = [
  { id: "1", professionSlug: "frontend-developer", title: "React Dev", company: "Яндекс", city: "Москва", format: "remote", salaryMin: 150000, salaryMax: 250000, experience: 2, employment: "full" },
  { id: "2", professionSlug: "frontend-developer", title: "Junior Front", company: "VK", city: "Санкт-Петербург", format: "office", salaryMin: 80000, salaryMax: 120000, experience: 0, employment: "full" },
  { id: "3", professionSlug: "data-analyst", title: "Analyst", company: "Сбер", city: "Москва", format: "hybrid", salaryMin: 130000, salaryMax: 200000, experience: 1, employment: "part" },
];

describe("matchesVacancyFilter", () => {
  it("matches all when filter empty", () => {
    expect(V.every((v) => matchesVacancyFilter(v, {}))).toBe(true);
  });
  it("filters by profession", () => {
    expect(matchesVacancyFilter(V[0], { professionSlug: "frontend-developer" })).toBe(true);
    expect(matchesVacancyFilter(V[0], { professionSlug: "data-analyst" })).toBe(false);
  });
  it("filters by city (case-insensitive exact)", () => {
    expect(matchesVacancyFilter(V[0], { city: "москва" })).toBe(true);
    expect(matchesVacancyFilter(V[1], { city: "Москва" })).toBe(false);
  });
  it("filters by company substring", () => {
    expect(matchesVacancyFilter(V[0], { company: "янд" })).toBe(true);
  });
  it("filters by format and employment", () => {
    expect(matchesVacancyFilter(V[0], { format: "remote" })).toBe(true);
    expect(matchesVacancyFilter(V[0], { format: "office" })).toBe(false);
    expect(matchesVacancyFilter(V[2], { employment: "part" })).toBe(true);
  });
  it("filters by salary range overlap", () => {
    expect(matchesVacancyFilter(V[1], { salaryFrom: 200000 })).toBe(false); // max 120k < 200k
    expect(matchesVacancyFilter(V[0], { salaryFrom: 200000 })).toBe(true); // max 250k
    expect(matchesVacancyFilter(V[0], { salaryTo: 100000 })).toBe(false); // min 150k > 100k
  });
  it("filters by max required experience", () => {
    expect(matchesVacancyFilter(V[0], { experienceMax: 1 })).toBe(false); // requires 2
    expect(matchesVacancyFilter(V[1], { experienceMax: 1 })).toBe(true); // requires 0
  });
});

describe("filterVacancies", () => {
  it("combines several filters", () => {
    const res = filterVacancies(V, { professionSlug: "frontend-developer", city: "Москва" });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("1");
  });
  it("returns empty when nothing matches", () => {
    expect(filterVacancies(V, { city: "Казань" })).toHaveLength(0);
  });
});
