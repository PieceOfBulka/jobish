export type SsoProvider = "google" | "vk" | "yandex";

export const SSO_PROVIDERS: {
  code: SsoProvider;
  name: string;
  label: string;
}[] = [
  { code: "google", name: "Google", label: "Google" },
  { code: "vk", name: "VK ID", label: "ВКонтакте" },
  { code: "yandex", name: "Яндекс ID", label: "Яндекс" },
];

export class SsoError extends Error {
  constructor(
    message: string,
    public code: "blocked" | "invalid" | "provider" = "invalid",
  ) {
    super(message);
    this.name = "SsoError";
  }
}

export function getAppUrl(): string {
  return (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function ssoRedirectUri(provider: SsoProvider): string {
  return `${getAppUrl()}/api/auth/sso/${provider}/callback`;
}

export function isSsoProvider(value: string): value is SsoProvider {
  return SSO_PROVIDERS.some((p) => p.code === value);
}

export function isProviderConfigured(provider: SsoProvider): boolean {
  switch (provider) {
    case "google":
      return Boolean(
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
      );
    case "vk":
      return Boolean(process.env.VK_CLIENT_ID && process.env.VK_CLIENT_SECRET);
    case "yandex":
      return Boolean(
        process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET,
      );
  }
}

/** Stub SSO when keys are missing or SSO_STUB=1 (default for local dev). */
export function shouldUseSsoStub(provider: SsoProvider): boolean {
  const flag = process.env.SSO_STUB?.toLowerCase();
  if (flag === "0" || flag === "false") {
    return !isProviderConfigured(provider);
  }
  if (flag === "1" || flag === "true") {
    return true;
  }
  return !isProviderConfigured(provider);
}

export function providerPublicMeta(provider: SsoProvider) {
  const meta = SSO_PROVIDERS.find((p) => p.code === provider)!;
  return {
    code: provider,
    name: meta.name,
    label: meta.label,
    configured: isProviderConfigured(provider),
  };
}

/** Minimal identity for SSO stub — empty account, no demo journey. */
export function stubSsoProfile(provider: SsoProvider): SsoProfile {
  return {
    providerUserId: `stub-${provider}`,
    email: `sso-${provider}@jobish.local`,
    name: "Пользователь",
  };
}

/** @deprecated use stubSsoProfile */
export const mockSsoProfile = stubSsoProfile;

export type SsoProfile = {
  providerUserId: string;
  email?: string | null;
  name?: string | null;
};

export function ssoErrorRedirect(message: string): string {
  return `${getAppUrl()}/login?sso_error=${encodeURIComponent(message)}`;
}

export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: ssoRedirectUri("google"),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function buildVkAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.VK_CLIENT_ID!,
    redirect_uri: ssoRedirectUri("vk"),
    response_type: "code",
    scope: "email",
    state,
    v: "5.131",
  });
  return `https://oauth.vk.com/authorize?${params}`;
}

export function buildYandexAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.YANDEX_CLIENT_ID!,
    redirect_uri: ssoRedirectUri("yandex"),
    state,
  });
  return `https://oauth.yandex.ru/authorize?${params}`;
}
