import { describe, it, expect } from "vitest";
import {
  detectCompletedSkills,
  detectInProgressSkills,
  motivationalBlock,
  buildCareerPortrait,
} from "../../src/lib/progress";
import { shouldLowerDifficulty, personalTestSize } from "../../src/lib/theory";

const skills = ["HTML и CSS", "JavaScript (ES6+)", "React", "TypeScript"];

describe("detectCompletedSkills", () => {
  it("detects mentioned skills when a progress verb is present", () => {
    const res = detectCompletedSkills("Я прошёл React и выучил TypeScript", skills);
    expect(res).toContain("React");
    expect(res).toContain("TypeScript");
  });
  it("returns nothing without a progress verb", () => {
    expect(detectCompletedSkills("Расскажи про React", skills)).toEqual([]);
  });
  it("does not match unrelated skills", () => {
    const res = detectCompletedSkills("Я освоил React", skills);
    expect(res).toEqual(["React"]);
  });

  it("detects in-progress skills", () => {
    const res = detectInProgressSkills("Сейчас изучаю React", skills);
    expect(res).toContain("React");
  });
});

describe("motivationalBlock", () => {
  it("computes percentage and includes next skill", () => {
    const b = motivationalBlock(1, 4, "React");
    expect(b).toMatch(/25%/);
    expect(b).toMatch(/React/);
  });
  it("celebrates full completion", () => {
    const b = motivationalBlock(4, 4);
    expect(b).toMatch(/100%/);
    expect(b).toMatch(/прошли весь трек/i);
  });
});

describe("buildCareerPortrait", () => {
  it("summarizes goal, progress and topics", () => {
    const p = buildCareerPortrait({
      targetTitle: "Frontend-разработчик",
      doneSkills: 2,
      totalSkills: 8,
      strongTopics: ["React"],
      weakTopics: ["CSS"],
    });
    expect(p).toMatch(/Frontend-разработчик/);
    expect(p).toMatch(/2\/8/);
    expect(p).toMatch(/React/);
    expect(p).toMatch(/CSS/);
  });
});

describe("difficulty (ФТ-7.8)", () => {
  it("lowers difficulty below 50%", () => {
    expect(shouldLowerDifficulty(40)).toBe(true);
    expect(shouldLowerDifficulty(50)).toBe(false);
  });
  it("personal test is shorter when lowered", () => {
    expect(personalTestSize(true)).toBe(3);
    expect(personalTestSize(false)).toBe(5);
  });
});
