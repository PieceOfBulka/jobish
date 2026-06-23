import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { buildGoalContext } from "@/lib/goals-service";
import { generateGoals } from "@/lib/goals";
import { prisma } from "@/lib/prisma";

const goalFieldsSchema = z.object({
  title: z.string().trim().min(3).max(200),
  horizon: z.string().trim().min(1).max(50),
  rationale: z.string().trim().min(3).max(1000),
});

const patchSchema = goalFieldsSchema.extend({
  id: z.string().min(1),
});

function serializeGoals(
  goals: { id: string; title: string; horizon: string; rationale: string }[],
) {
  return goals.map((g) => ({
    id: g.id,
    title: g.title,
    horizon: g.horizon,
    rationale: g.rationale,
  }));
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.action === "create") {
    const parsed = goalFieldsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Заполните все поля цели" }, { status: 400 });
    }
    const count = await prisma.careerGoal.count({ where: { userId } });
    if (count >= 10) {
      return NextResponse.json({ error: "Не более 10 карьерных целей" }, { status: 400 });
    }
    const created = await prisma.careerGoal.create({
      data: { userId, ...parsed.data },
    });
    return NextResponse.json({ ok: true, goal: serializeGoals([created])[0] });
  }

  const variant =
    typeof body.variant === "number" && Number.isFinite(body.variant)
      ? Math.max(0, Math.floor(body.variant))
      : 0;

  const ctx = await buildGoalContext(userId, variant);
  if (!ctx) {
    return NextResponse.json(
      { error: "Сначала пройдите профориентацию или выберите трек развития." },
      { status: 400 },
    );
  }

  const goals = generateGoals(ctx);
  await prisma.careerGoal.deleteMany({ where: { userId } });
  await prisma.careerGoal.createMany({
    data: goals.map((g) => ({
      userId,
      title: g.title,
      horizon: g.horizon,
      rationale: g.rationale,
    })),
  });

  const saved = await prisma.careerGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, goals: serializeGoals(saved) });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Проверьте поля цели" }, { status: 400 });
  }

  const existing = await prisma.careerGoal.findFirst({
    where: { id: parsed.data.id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  const updated = await prisma.careerGoal.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      horizon: parsed.data.horizon,
      rationale: parsed.data.rationale,
    },
  });

  return NextResponse.json({ ok: true, goal: serializeGoals([updated])[0] });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не указан id" }, { status: 400 });

  const existing = await prisma.careerGoal.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  await prisma.careerGoal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
