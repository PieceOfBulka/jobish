import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Мок оформления подписки (без реального эквайринга). См. docs/audit.md.
const schema = z.object({ plan: z.enum(["free", "start", "optimal", "pro"]) });
const DURATIONS: Record<string, number> = {
  start: 7,
  optimal: 30,
  pro: 90,
};

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверный тариф" }, { status: 400 });
  }
  const { plan } = parsed.data;
  const days = DURATIONS[plan];
  const expiresAt = days
    ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    : null;

  await prisma.subscription.upsert({
    where: { userId },
    update: { plan, status: "active", startedAt: new Date(), expiresAt },
    create: { userId, plan, status: "active", expiresAt },
  });

  return NextResponse.json({ ok: true });
}
