import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { coachReply, isCareerRelated } from "../../src/lib/ai";

describe("isCareerRelated", () => {
  it("recognizes career topics", () => {
    expect(isCareerRelated("как стать фронтенд-разработчиком")).toBe(true);
    expect(isCareerRelated("привет")).toBe(true);
  });

  it("rejects off-topic questions", () => {
    expect(isCareerRelated("какая высота горы эверест")).toBe(false);
    expect(isCareerRelated("кто выиграл чемпионат мира по футболу")).toBe(false);
  });
});

describe("coachReply mock", () => {
  const prevKey = process.env.OPENROUTER_API_KEY;

  beforeEach(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  afterEach(() => {
    if (prevKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = prevKey;
  });

  it("refuses off-topic questions in mock mode", async () => {
    const { content, source } = await coachReply(
      [{ role: "user", content: "какая высота горы эверест" }],
      { targetProfession: "Frontend-разработчик" },
    );
    expect(source).toBe("mock");
    expect(content).toMatch(/карьер/i);
    expect(content).not.toMatch(/8\s*848|эверест/i);
  });

  it("answers career questions in mock mode", async () => {
    const { content, source } = await coachReply(
      [{ role: "user", content: "какие навыки нужны джуну" }],
      {},
    );
    expect(source).toBe("mock");
    expect(content).toMatch(/навык/i);
  });
});
