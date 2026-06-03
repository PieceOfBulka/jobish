import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа"),
  email: z.string().trim().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Неверные данные" },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;
  const normEmail = email.toLowerCase();

  const exists = await prisma.user.findUnique({ where: { email: normEmail } });
  if (exists) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normEmail,
      passwordHash: await hashPassword(password),
      profile: { create: {} },
      subscription: { create: { plan: "free" } },
    },
  });

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
