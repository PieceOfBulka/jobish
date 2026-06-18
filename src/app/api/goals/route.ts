import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateGoals } from "@/lib/goals";
import { PROFESSION_TITLES } from "@/lib/orientation";

export async function POST() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile?.targetProfession) {
    return NextResponse.json(
      { error: "Сначала выберите трек развития (профессию)." },
      { status: 400 },
    );
  }

  const title =
    PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession;
  const goals = generateGoals(title, profile.experienceMonths);

  await prisma.careerGoal.deleteMany({ where: { userId } });
  await prisma.careerGoal.createMany({
    data: goals.map((g) => ({
      userId,
      title: g.title,
      horizon: g.horizon,
      rationale: g.rationale,
    })),
  });

  return NextResponse.json({ ok: true, goals });
}
