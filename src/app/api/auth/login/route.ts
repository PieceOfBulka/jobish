import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionResponse } from "@/lib/auth";

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
  if (!user) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }
  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "Для этого аккаунта доступен только вход через Google, ВКонтакте или Яндекс" },
      { status: 401 },
    );
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Неверный email или пароль" },
      { status: 401 },
    );
  }
  if (user.isBlocked) {
    return NextResponse.json(
      { error: "Аккаунт заблокирован. Обратитесь в поддержку." },
      { status: 403 },
    );
  }
  return createSessionResponse(user.id, {
    ok: true,
    needsVerification: !user.isVerified,
  });
}
