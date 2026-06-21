import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_LOCALE, LANG_COOKIE_KEY, isLocale } from "@/lib/locale";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const existing = request.cookies.get(LANG_COOKIE_KEY)?.value;

  if (!isLocale(existing)) {
    response.cookies.set(LANG_COOKIE_KEY, DEFAULT_LOCALE, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
