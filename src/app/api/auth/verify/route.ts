import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ФТ-1.6 — подтверждение почты кодом
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const code = String(body?.code ?? "").trim();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  if (user.isVerified) return NextResponse.json({ ok: true });

  if (!code || code !== user.verificationCode) {
    return NextResponse.json({ error: "Неверный код подтверждения" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, verificationCode: null },
  });
  return NextResponse.json({ ok: true });
}

// Повторная отправка кода (мок)
export async function PUT() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const code = String(Math.floor(100000 + Math.random() * 900000));
  await prisma.user.update({ where: { id: userId }, data: { verificationCode: code } });
  return NextResponse.json({ ok: true, demoCode: code });
}
