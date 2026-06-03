import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  stepId: z.string().min(1),
  status: z.enum(["not_started", "in_progress", "done"]),
});

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }
  const { stepId, status } = parsed.data;

  // Проверяем, что шаг принадлежит пользователю
  const step = await prisma.roadmapStep.findUnique({
    where: { id: stepId },
    include: { stage: { include: { roadmap: true } } },
  });
  if (!step || step.stage.roadmap.userId !== userId) {
    return NextResponse.json({ error: "Шаг не найден" }, { status: 404 });
  }

  await prisma.roadmapStep.update({ where: { id: stepId }, data: { status } });
  return NextResponse.json({ ok: true });
}
