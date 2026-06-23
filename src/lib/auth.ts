import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "jobish-dev-secret-change-me",
);
export const SESSION_COOKIE = "jobish_session";
export const LAST_SSO_COOKIE = "jobish_last_sso";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

/** Sets session cookie on a Route Handler response (preferred for login/register). */
export async function createSessionResponse(
  userId: string,
  body: Record<string, unknown>,
  status = 200,
): Promise<NextResponse> {
  const token = await signSessionToken(userId);
  const res = NextResponse.json(body, { status });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}

export async function createSession(userId: string): Promise<void> {
  const token = await signSessionToken(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

/** Sets session cookie and redirects (OAuth callbacks). */
export async function createSessionRedirect(
  userId: string,
  redirectTo: string,
  lastSsoProvider?: string,
): Promise<NextResponse> {
  const token = await signSessionToken(userId);
  const res = NextResponse.redirect(redirectTo);
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  if (lastSsoProvider) {
    res.cookies.set(LAST_SSO_COOKIE, lastSsoProvider, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  isVerified: boolean;
  isBlocked: boolean;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const userId = await getUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.subscription?.plan ?? "free",
    isVerified: user.isVerified,
    isBlocked: user.isBlocked,
  };
}
