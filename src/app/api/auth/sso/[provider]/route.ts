import { NextRequest, NextResponse } from "next/server";
import {
  createOAuthState,
  isSsoProvider,
  stubSsoProfile,
  shouldUseSsoStub,
  buildSsoAuthUrl,
  upsertSsoUser,
  SsoError,
  ssoErrorRedirect,
  OAUTH_STATE_COOKIE,
} from "@/lib/sso";
import {
  createSessionRedirect,
  sessionCookieOptions,
} from "@/lib/auth";

type RouteContext = { params: Promise<{ provider: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { provider: raw } = await ctx.params;
  if (!isSsoProvider(raw)) {
    return NextResponse.json({ error: "Неизвестный провайдер" }, { status: 400 });
  }

  if (shouldUseSsoStub(raw)) {
    try {
      const profile = stubSsoProfile(raw);
      const { userId } = await upsertSsoUser(raw, profile);
      return createSessionRedirect(
        userId,
        new URL("/dashboard", req.url).toString(),
        raw,
      );
    } catch (e) {
      const message =
        e instanceof SsoError ? e.message : "Не удалось войти";
      return NextResponse.redirect(ssoErrorRedirect(message));
    }
  }

  const state = await createOAuthState(raw);
  const res = NextResponse.redirect(buildSsoAuthUrl(raw, state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    ...sessionCookieOptions(),
    maxAge: 60 * 10,
  });
  return res;
}
