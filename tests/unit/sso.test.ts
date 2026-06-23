import { describe, it, expect, afterEach } from "vitest";
import {
  isSsoProvider,
  isProviderConfigured,
  shouldUseSsoStub,
  stubSsoProfile,
  buildYandexAuthUrl,
} from "../../src/lib/sso-core";

describe("isSsoProvider", () => {
  it("accepts supported providers", () => {
    expect(isSsoProvider("google")).toBe(true);
    expect(isSsoProvider("vk")).toBe(true);
    expect(isSsoProvider("yandex")).toBe(true);
  });

  it("rejects unknown providers", () => {
    expect(isSsoProvider("telegram")).toBe(false);
    expect(isSsoProvider("facebook")).toBe(false);
  });
});

describe("isProviderConfigured", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("returns false without env keys", () => {
    delete process.env.YANDEX_CLIENT_ID;
    delete process.env.YANDEX_CLIENT_SECRET;
    expect(isProviderConfigured("yandex")).toBe(false);
  });
});

describe("shouldUseSsoStub", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("uses stub when SSO_STUB=1 even with keys", () => {
    process.env.SSO_STUB = "1";
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    expect(shouldUseSsoStub("google")).toBe(true);
  });

  it("uses real oauth when SSO_STUB=0 and keys set", () => {
    process.env.SSO_STUB = "0";
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    expect(shouldUseSsoStub("google")).toBe(false);
  });
});

describe("stubSsoProfile", () => {
  it("creates a minimal empty-account identity", () => {
    const profile = stubSsoProfile("google");
    expect(profile.name).toBe("Пользователь");
    expect(profile.email).toBe("sso-google@jobish.local");
    expect(profile.providerUserId).toBe("stub-google");
    expect(profile.name).not.toMatch(/демо|google|яндекс/i);
  });
});

describe("buildYandexAuthUrl", () => {
  it("builds yandex oauth url", () => {
    process.env.YANDEX_CLIENT_ID = "test-client";
    process.env.APP_URL = "http://localhost:3000";
    const url = buildYandexAuthUrl("state-token");
    expect(url).toContain("oauth.yandex.ru/authorize");
    expect(url).toContain("client_id=test-client");
    expect(url).toContain("state=state-token");
  });
});
