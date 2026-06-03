import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().trim().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
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
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
