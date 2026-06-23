import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ isBlocked: z.boolean() });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const { isBlocked } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Нельзя заблокировать администратора" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { isBlocked } });

  // Логируем действие администратора (US17: все действия логируются)
  console.info(
    `[ADMIN] ${admin.email} ${isBlocked ? "blocked" : "unblocked"} user ${target.email} at ${new Date().toISOString()}`,
  );

  return NextResponse.json({ ok: true, isBlocked });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, subscription: true, careerGoals: true },
  });
  if (!user) return NextResponse.json({ error: "Не найден" }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isBlocked: user.isBlocked,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    profile: user.profile,
    careerGoals: user.careerGoals,
  });
}
