import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Мок разморозки: покупка доп. попытки или просмотр рекламы (ФТ-4, монетизация).
const schema = z.object({
  testId: z.string().min(1),
  method: z.enum(["purchase", "ad"]),
});

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const last = await prisma.theoryAttempt.findFirst({
    where: { userId, testId: parsed.data.testId },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return NextResponse.json({ error: "Нет попыток" }, { status: 404 });

  await prisma.theoryAttempt.update({
    where: { id: last.id },
    data: { extraTries: last.extraTries + 1 },
  });

  return NextResponse.json({ ok: true });
}
