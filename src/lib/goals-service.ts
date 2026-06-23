// Shared auto-generation of career goals (US9).

import { prisma } from "./prisma";
import { generateGoals } from "./goals";
import { PROFESSION_TITLES, type ProfessionMatch } from "./orientation";

export async function buildGoalContext(userId: string, variant = 0) {
  const profile = await prisma.profile.findUnique({ where: { userId } });
  const orientation = await prisma.orientationResult.findUnique({
    where: { userId },
  });

  let professionSlug = profile?.targetProfession ?? null;
  if (!professionSlug && orientation) {
    try {
      const matches = JSON.parse(orientation.topMatches) as ProfessionMatch[];
      professionSlug = matches[0]?.slug ?? null;
    } catch {
      /* ignore */
    }
  }
  if (!professionSlug) return null;

  const professionTitle =
    PROFESSION_TITLES[professionSlug] ?? professionSlug;

  const roadmap = profile?.targetProfession
    ? await prisma.roadmap.findFirst({
        where: { userId, professionSlug: profile.targetProfession },
        orderBy: { createdAt: "desc" },
        include: {
          stages: {
            orderBy: { order: "asc" },
            include: { steps: { orderBy: { order: "asc" } } },
          },
        },
      })
    : null;

  const steps = roadmap?.stages.flatMap((s) => s.steps) ?? [];
  const roadmapDone = steps.filter((s) => s.status === "done").length;
  const inProgressSkills = steps
    .filter((s) => s.status === "in_progress")
    .map((s) => s.skillName);
  const nextSkill = steps.find((s) => s.status !== "done")?.skillName ?? null;

  const attempts = await prisma.theoryAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const weakTopics = [
    ...new Set(
      attempts.flatMap((a) => {
        try {
          return JSON.parse(a.weakTopics ?? "[]") as string[];
        } catch {
          return [];
        }
      }),
    ),
  ].slice(0, 5);

  return {
    professionTitle,
    experienceMonths: profile?.experienceMonths ?? 0,
    currentPosition: profile?.currentPosition,
    roadmapDone,
    roadmapTotal: steps.length || 12,
    nextSkill,
    inProgressSkills,
    weakTopics,
    variant,
  };
}

export async function autoGenerateGoalsForUser(userId: string, variant = 0) {
  const ctx = await buildGoalContext(userId, variant);
  if (!ctx) return null;

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
  return goals;
}
