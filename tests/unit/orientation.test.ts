import { describe, it, expect } from "vitest";
import {
  scoreAnswers,
  topMatches,
  hasStrongMatch,
  randomAnswers,
  MAX_MATCHES,
  MATCH_THRESHOLD,
  ORIENTATION_QUESTIONS,
} from "../../src/lib/orientation";

describe("ORIENTATION_QUESTIONS bank (ФТ-2.1)", () => {
  it("contains at least 30 questions (нижняя граница 30–60)", () => {
    expect(ORIENTATION_QUESTIONS.length).toBeGreaterThanOrEqual(30);
  });

  it("each question has a unique id and ≥2 options", () => {
    const ids = new Set<string>();
    for (const q of ORIENTATION_QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
    }
  });
});

describe("randomAnswers (демо «пропустить опрос»)", () => {
  it("returns a valid option index for every question", () => {
    const a = randomAnswers();
    expect(Object.keys(a)).toHaveLength(ORIENTATION_QUESTIONS.length);
    for (const q of ORIENTATION_QUESTIONS) {
      const idx = a[q.id];
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(q.options.length);
    }
  });

  it("produces a scorable, ranked result", () => {
    const matches = topMatches(scoreAnswers(randomAnswers()));
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(MAX_MATCHES);
  });
});

describe("scoreAnswers", () => {
  it("returns zeros for empty answers", () => {
    const s = scoreAnswers({});
    expect(s).toEqual({ tech: 0, data: 0, design: 0, product: 0, people: 0 });
  });

  it("accumulates weights from chosen options", () => {
    // Все ответы — первый вариант (обычно tech-направленный)
    const answers = Object.fromEntries(
      ORIENTATION_QUESTIONS.map((q) => [q.id, 0]),
    );
    const s = scoreAnswers(answers);
    expect(s.tech).toBeGreaterThan(0);
    const total = Object.values(s).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });

  it("ignores out-of-range option indexes", () => {
    const s = scoreAnswers({ [ORIENTATION_QUESTIONS[0].id]: 999 });
    expect(Object.values(s).reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe("topMatches", () => {
  it("ranks tech professions first for tech-heavy scores", () => {
    const matches = topMatches({ tech: 9, data: 1, design: 0, product: 0, people: 0 });
    expect(matches[0].slug).toBe("frontend-developer");
    expect(matches[0].match).toBeGreaterThanOrEqual(matches[1].match);
  });

  it("ranks people professions first for people-heavy scores", () => {
    const matches = topMatches({ tech: 0, data: 0, design: 0, product: 1, people: 9 });
    expect(matches[0].slug).toBe("hr-it-specialist");
  });

  it("returns matches sorted descending and capped by limit", () => {
    const matches = topMatches({ tech: 3, data: 3, design: 3, product: 3, people: 3 }, 3);
    expect(matches).toHaveLength(3);
    for (let i = 1; i < matches.length; i++) {
      expect(matches[i - 1].match).toBeGreaterThanOrEqual(matches[i].match);
    }
  });

  it("produces match values within 0..100", () => {
    const matches = topMatches({ tech: 5, data: 2, design: 1, product: 0, people: 3 });
    for (const m of matches) {
      expect(m.match).toBeGreaterThanOrEqual(0);
      expect(m.match).toBeLessThanOrEqual(100);
    }
  });

  it("caps at MAX_MATCHES (<=5) per ФТ-2.2", () => {
    const matches = topMatches({ tech: 3, data: 3, design: 3, product: 3, people: 3 }, 99);
    expect(matches.length).toBeLessThanOrEqual(MAX_MATCHES);
  });

  it("includes a non-empty rationale for each match", () => {
    const matches = topMatches({ tech: 9, data: 1, design: 0, product: 0, people: 0 });
    for (const m of matches) expect(m.rationale.length).toBeGreaterThan(0);
  });

  it("hasStrongMatch reflects the 70% threshold", () => {
    const strong = topMatches({ tech: 9, data: 0, design: 0, product: 0, people: 0 });
    expect(hasStrongMatch(strong)).toBe(true);
    expect(MATCH_THRESHOLD).toBe(70);
    const none = [{ slug: "x", title: "X", match: 40, rationale: "r" }];
    expect(hasStrongMatch(none)).toBe(false);
  });
});
