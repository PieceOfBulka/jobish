import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionResponse } from "@/lib/auth";
import {
  isValidEmail,
  validatePassword,
  passwordsMatch,
  validateFullName,
} from "@/lib/validation";

function genCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }
  const { name = "", email = "", password = "", passwordConfirm = "" } = body;

  // ФТ-1.1 / ФТ-1.2 — валидация
  const nameCheck = validateFullName(String(name));
  if (!nameCheck.ok) return NextResponse.json({ error: nameCheck.error }, { status: 400 });

  if (!isValidEmail(String(email))) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  const pwCheck = validatePassword(String(password));
  if (!pwCheck.ok) return NextResponse.json({ error: pwCheck.error }, { status: 400 });

  if (!passwordsMatch(String(password), String(passwordConfirm))) {
    return NextResponse.json({ error: "Пароли не совпадают" }, { status: 400 });
  }

  const normEmail = String(email).toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: normEmail } });
  if (exists) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 },
    );
  }

  const code = genCode();
  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normEmail,
      passwordHash: await hashPassword(String(password)),
      passwordAlgo: "bcrypt",
      isVerified: false,
      verificationCode: code,
      profile: { create: {} },
      subscription: { create: { plan: "free" } },
    },
  });

  // Мок доставки письма (ФТ-1.6): код возвращаем для демо-подтверждения.
  return createSessionResponse(user.id, {
    ok: true,
    needsVerification: true,
    demoCode: code,
  });
}
