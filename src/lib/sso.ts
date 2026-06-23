import "server-only";
import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";
import {
  SsoError,
  type SsoProfile,
  type SsoProvider,
  buildGoogleAuthUrl,
  buildVkAuthUrl,
  buildYandexAuthUrl,
  getAppUrl,
  isProviderConfigured,
  isSsoProvider,
  providerPublicMeta,
  ssoErrorRedirect,
  ssoRedirectUri,
} from "./sso-core";

export * from "./sso-core";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "jobish-dev-secret-change-me",
);

export const OAUTH_STATE_COOKIE = "jobish_oauth_state";

const AUTH_URL_BUILDERS: Record<SsoProvider, (state: string) => string> = {
  google: buildGoogleAuthUrl,
  vk: buildVkAuthUrl,
  yandex: buildYandexAuthUrl,
};

export function buildSsoAuthUrl(provider: SsoProvider, state: string): string {
  return AUTH_URL_BUILDERS[provider](state);
}

export async function createOAuthState(provider: SsoProvider): Promise<string> {
  return new SignJWT({ provider, nonce: crypto.randomUUID() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(JWT_SECRET);
}

export async function verifyOAuthState(
  token: string,
  provider: SsoProvider,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.provider === provider;
  } catch {
    return false;
  }
}

export async function upsertSsoUser(
  provider: SsoProvider,
  profile: SsoProfile,
): Promise<{ userId: string; isNew: boolean }> {
  const existing = await prisma.userAuthAccount.findUnique({
    where: {
      providerCode_providerUserId: {
        providerCode: provider,
        providerUserId: profile.providerUserId,
      },
    },
    include: { user: true },
  });
  if (existing) {
    if (existing.user.isBlocked) {
      throw new SsoError("Аккаунт заблокирован", "blocked");
    }
    return { userId: existing.userId, isNew: false };
  }

  const normEmail = profile.email?.toLowerCase().trim() || null;
  let user = normEmail
    ? await prisma.user.findUnique({ where: { email: normEmail } })
    : null;

  if (user) {
    if (user.isBlocked) {
      throw new SsoError("Аккаунт заблокирован", "blocked");
    }
    await prisma.userAuthAccount.create({
      data: {
        userId: user.id,
        providerCode: provider,
        providerUserId: profile.providerUserId,
        email: normEmail,
      },
    });
    if (!user.isVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true, verificationCode: null },
      });
    }
    return { userId: user.id, isNew: false };
  }

  const email =
    normEmail ?? `${provider}-${profile.providerUserId}@sso.jobish.local`;
  const name = profile.name?.trim() || "Пользователь";

  user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: null,
      isVerified: true,
      profile: { create: {} },
      subscription: { create: { plan: "free" } },
      authAccounts: {
        create: {
          providerCode: provider,
          providerUserId: profile.providerUserId,
          email: normEmail,
        },
      },
    },
  });

  return { userId: user.id, isNew: true };
}

export async function exchangeGoogleCode(code: string): Promise<SsoProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: ssoRedirectUri("google"),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) {
    throw new SsoError("Не удалось авторизоваться через Google");
  }
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string | undefined;
  if (!accessToken) throw new SsoError("Пустой ответ Google");

  const profileRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!profileRes.ok) {
    throw new SsoError("Не удалось получить профиль Google");
  }
  const profile = await profileRes.json();
  return {
    providerUserId: String(profile.sub),
    email: profile.email ?? null,
    name: profile.name ?? null,
  };
}

export async function exchangeVkCode(code: string): Promise<SsoProfile> {
  const tokenRes = await fetch("https://oauth.vk.com/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.VK_CLIENT_ID!,
      client_secret: process.env.VK_CLIENT_SECRET!,
      redirect_uri: ssoRedirectUri("vk"),
      code,
    }),
  });
  if (!tokenRes.ok) {
    throw new SsoError("Не удалось авторизоваться через VK");
  }
  const tokenData = await tokenRes.json();
  if (tokenData.error) {
    throw new SsoError(String(tokenData.error_description ?? tokenData.error));
  }

  const userId = String(tokenData.user_id);
  const email = (tokenData.email as string | undefined) ?? null;

  const usersRes = await fetch(
    `https://api.vk.com/method/users.get?${new URLSearchParams({
      user_ids: userId,
      fields: "first_name,last_name",
      access_token: tokenData.access_token,
      v: "5.131",
    })}`,
  );
  const usersData = await usersRes.json();
  const vkUser = usersData.response?.[0];
  const name = vkUser
    ? `${vkUser.first_name ?? ""} ${vkUser.last_name ?? ""}`.trim()
    : null;

  return { providerUserId: userId, email, name: name || null };
}

export async function exchangeYandexCode(code: string): Promise<SsoProfile> {
  const tokenRes = await fetch("https://oauth.yandex.ru/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.YANDEX_CLIENT_ID!,
      client_secret: process.env.YANDEX_CLIENT_SECRET!,
      redirect_uri: ssoRedirectUri("yandex"),
    }),
  });
  if (!tokenRes.ok) {
    throw new SsoError("Не удалось авторизоваться через Яндекс");
  }
  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token as string | undefined;
  if (!accessToken) throw new SsoError("Пустой ответ Яндекс");

  const profileRes = await fetch("https://login.yandex.ru/info?format=json", {
    headers: { Authorization: `OAuth ${accessToken}` },
  });
  if (!profileRes.ok) {
    throw new SsoError("Не удалось получить профиль Яндекс");
  }
  const profile = await profileRes.json();
  return {
    providerUserId: String(profile.id),
    email: profile.default_email ?? null,
    name:
      profile.real_name ??
      profile.display_name ??
      profile.login ??
      null,
  };
}

const CODE_EXCHANGERS: Record<
  SsoProvider,
  (code: string) => Promise<SsoProfile>
> = {
  google: exchangeGoogleCode,
  vk: exchangeVkCode,
  yandex: exchangeYandexCode,
};

export async function exchangeSsoCode(
  provider: SsoProvider,
  code: string,
): Promise<SsoProfile> {
  return CODE_EXCHANGERS[provider](code);
}

export {
  buildGoogleAuthUrl,
  buildVkAuthUrl,
  buildYandexAuthUrl,
  getAppUrl,
  isProviderConfigured,
  isSsoProvider,
  providerPublicMeta,
  ssoErrorRedirect,
};
