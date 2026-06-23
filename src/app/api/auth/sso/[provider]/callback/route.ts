import { NextRequest, NextResponse } from "next/server";
import {
  exchangeSsoCode,
  isSsoProvider,
  upsertSsoUser,
  verifyOAuthState,
  SsoError,
  ssoErrorRedirect,
  OAUTH_STATE_COOKIE,
} from "@/lib/sso";
import { createSessionRedirect } from "@/lib/auth";

type RouteContext = { params: Promise<{ provider: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  const { provider: raw } = await ctx.params;
  if (!isSsoProvider(raw)) {
    return NextResponse.redirect(ssoErrorRedirect("Неизвестный провайдер"));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthError = req.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      ssoErrorRedirect("Авторизация отменена или отклонена"),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(ssoErrorRedirect("Некорректный ответ провайдера"));
  }

  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!stateCookie || stateCookie !== state) {
    return NextResponse.redirect(ssoErrorRedirect("Сессия истекла, попробуйте снова"));
  }
  if (!(await verifyOAuthState(state, raw))) {
    return NextResponse.redirect(ssoErrorRedirect("Некорректный ответ авторизации"));
  }

  try {
    const profile = await exchangeSsoCode(raw, code);
    const { userId } = await upsertSsoUser(raw, profile);
    const res = await createSessionRedirect(
      userId,
      new URL("/dashboard", req.url).toString(),
      raw,
    );
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  } catch (e) {
    const message =
      e instanceof SsoError ? e.message : "Не удалось войти";
    return NextResponse.redirect(ssoErrorRedirect(message));
  }
}
