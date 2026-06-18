import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  validatePassword,
  passwordsMatch,
  validateFullName,
  validateTelegram,
  validateAge,
  validateExperienceMonths,
  validateSkillTags,
  GRADE_LEVELS,
  CURRENT_POSITIONS,
} from "../../src/lib/validation";

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a.b@mail.ru")).toBe(true);
  });
  it("rejects invalid emails", () => {
    expect(isValidEmail("noatsign")).toBe(false);
    expect(isValidEmail("no@domain")).toBe(false);
    expect(isValidEmail("@x.com")).toBe(false);
    expect(isValidEmail("a b@x.com")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("accepts a strong password (>8, letters+digits+special)", () => {
    expect(validatePassword("Str0ng!pass").ok).toBe(true);
  });
  it("rejects short password (<=8)", () => {
    expect(validatePassword("Ab1!xy").ok).toBe(false);
  });
  it("requires letters", () => {
    expect(validatePassword("12345678!9").ok).toBe(false);
  });
  it("requires digits", () => {
    expect(validatePassword("abcdefgh!").ok).toBe(false);
  });
  it("requires special chars", () => {
    expect(validatePassword("abcdefg123").ok).toBe(false);
  });
  it("rejects common passwords", () => {
    // даже если бы прошёл по символам — есть в чёрном списке
    expect(validatePassword("password1").ok).toBe(false);
  });
});

describe("passwordsMatch", () => {
  it("true when equal and non-empty", () => {
    expect(passwordsMatch("abc", "abc")).toBe(true);
  });
  it("false when different or empty", () => {
    expect(passwordsMatch("abc", "abd")).toBe(false);
    expect(passwordsMatch("", "")).toBe(false);
  });
});

describe("validateFullName", () => {
  it("accepts cyrillic and latin names with spaces/hyphen", () => {
    expect(validateFullName("Иван Иванов").ok).toBe(true);
    expect(validateFullName("Anna-Maria Smith").ok).toBe(true);
  });
  it("rejects empty and names with digits/symbols", () => {
    expect(validateFullName("").ok).toBe(false);
    expect(validateFullName("Иван123").ok).toBe(false);
    expect(validateFullName("user@x").ok).toBe(false);
  });
});

describe("validateTelegram", () => {
  it("optional: empty is ok", () => {
    expect(validateTelegram("").ok).toBe(true);
  });
  it("requires leading @", () => {
    expect(validateTelegram("@ivanov").ok).toBe(true);
    expect(validateTelegram("ivanov").ok).toBe(false);
    expect(validateTelegram("@").ok).toBe(false);
  });
});

describe("validateAge", () => {
  it("allows null/undefined (optional)", () => {
    expect(validateAge(null).ok).toBe(true);
    expect(validateAge(undefined).ok).toBe(true);
  });
  it("enforces 0..150 integer", () => {
    expect(validateAge(25).ok).toBe(true);
    expect(validateAge(-1).ok).toBe(false);
    expect(validateAge(200).ok).toBe(false);
    expect(validateAge(25.5).ok).toBe(false);
  });
});

describe("validateExperienceMonths", () => {
  it("enforces 0..1000 integer", () => {
    expect(validateExperienceMonths(24).ok).toBe(true);
    expect(validateExperienceMonths(0).ok).toBe(true);
    expect(validateExperienceMonths(1001).ok).toBe(false);
    expect(validateExperienceMonths(-5).ok).toBe(false);
  });
});

describe("validateSkillTags", () => {
  it("allows empty", () => {
    expect(validateSkillTags([]).ok).toBe(true);
  });
  it("rejects empty tag and >10 tags", () => {
    expect(validateSkillTags(["js", ""]).ok).toBe(false);
    expect(validateSkillTags(Array(11).fill("x")).ok).toBe(false);
  });
});

describe("enums match the data model", () => {
  it("grade levels include required values", () => {
    expect(GRADE_LEVELS).toContain("Бакалавр");
    expect(GRADE_LEVELS).toContain("Самообразование");
  });
  it("positions include required values", () => {
    expect(CURRENT_POSITIONS).toContain("Junior");
    expect(CURRENT_POSITIONS).toContain("Head");
  });
});
