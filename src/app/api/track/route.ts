import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoadmap } from "@/lib/roadmap";
import { generateGoals } from "@/lib/goals";
import { PROFESSION_TITLES } from "@/lib/orientation";

const schema = z.object({ slug: z.string().min(1) });

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const { slug } = parsed.data;

  try {
    const roadmap = await generateRoadmap(userId, slug);

    // US9: автоматически генерируем карьерные цели при выборе трека
    const profile = await prisma.profile.findUnique({ where: { userId } });
    const title = PROFESSION_TITLES[slug] ?? slug;
    const goals = generateGoals(title, profile?.experienceMonths ?? 0);
    await prisma.careerGoal.deleteMany({ where: { userId } });
    await prisma.careerGoal.createMany({
      data: goals.map((g) => ({
        userId,
        title: g.title,
        horizon: g.horizon,
        rationale: g.rationale,
      })),
    });

    return NextResponse.json({ ok: true, roadmapId: roadmap.id, goalsGenerated: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      { status: 400 },
    );
  }
}
