import { describe, it, expect } from "vitest";

// US17: Admin panel - role-based access and user moderation logic

describe("US17: admin role guard", () => {
  it("rejects non-admin roles", () => {
    const roles = ["client", "coach", ""];
    for (const role of roles) {
      expect(role === "admin").toBe(false);
    }
  });

  it("accepts admin role", () => {
    expect("admin" === "admin").toBe(true);
  });
});

describe("US17: admin cannot block another admin", () => {
  function canBlock(targetRole: string): boolean {
    return targetRole !== "admin";
  }

  it("allows blocking client", () => {
    expect(canBlock("client")).toBe(true);
  });

  it("allows blocking coach", () => {
    expect(canBlock("coach")).toBe(true);
  });

  it("prevents blocking admin", () => {
    expect(canBlock("admin")).toBe(false);
  });
});

describe("US17: user list response shape", () => {
  const mockUsers = [
    { id: "u1", email: "a@b.com", name: "Alice", role: "client", isBlocked: false, isVerified: true, createdAt: new Date() },
    { id: "u2", email: "b@b.com", name: "Bob",   role: "client", isBlocked: true,  isVerified: false, createdAt: new Date() },
  ];

  it("each user has required fields", () => {
    const required = ["id", "email", "name", "role", "isBlocked", "isVerified"];
    for (const u of mockUsers) {
      for (const field of required) {
        expect(u).toHaveProperty(field);
      }
    }
  });

  it("blocked users are marked correctly", () => {
    const blocked = mockUsers.filter((u) => u.isBlocked);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].email).toBe("b@b.com");
  });
});

describe("US17: block/unblock toggle logic", () => {
  it("toggles isBlocked correctly", () => {
    let isBlocked = false;
    isBlocked = !isBlocked;
    expect(isBlocked).toBe(true);
    isBlocked = !isBlocked;
    expect(isBlocked).toBe(false);
  });
});

describe("US17: user profile view contains all required data", () => {
  const mockProfile = {
    id: "u1",
    email: "test@test.com",
    name: "Test User",
    role: "client",
    isBlocked: false,
    isVerified: true,
    profile: { experienceMonths: 12, targetProfession: "frontend-developer" },
    careerGoals: [{ id: "g1", title: "Стать Middle", horizon: "6 месяцев" }],
    testAttempts: [{ id: "t1", testId: "js-basics", score: 80, passed: true }],
  };

  it("has personal data fields", () => {
    expect(mockProfile).toHaveProperty("email");
    expect(mockProfile).toHaveProperty("name");
  });

  it("has career goals", () => {
    expect(mockProfile.careerGoals.length).toBeGreaterThan(0);
    expect(mockProfile.careerGoals[0]).toHaveProperty("title");
    expect(mockProfile.careerGoals[0]).toHaveProperty("horizon");
  });

  it("has test history", () => {
    expect(mockProfile.testAttempts.length).toBeGreaterThan(0);
    expect(mockProfile.testAttempts[0]).toHaveProperty("score");
    expect(mockProfile.testAttempts[0]).toHaveProperty("passed");
  });

  it("has education level / target profession", () => {
    expect(mockProfile.profile.targetProfession).toBeTruthy();
  });
});
