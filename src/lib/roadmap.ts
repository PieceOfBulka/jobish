import "server-only";
import { prisma } from "./prisma";

const GRADE_STAGES = [
  { key: "junior", title: "Junior — фундамент" },
  { key: "middle", title: "Middle — уверенный специалист" },
  { key: "senior", title: "Senior — экспертиза" },
] as const;

/**
 * Генерирует (или пересоздаёт) карту развития пользователя по профессии.
 * Этапы — по грейдам, шаги — навыки с привязкой материалов (ФТ-3, ФТ-4, US1).
 */
export async function generateRoadmap(userId: string, slug: string) {
  const profession = await prisma.profession.findUnique({
    where: { slug },
    include: {
      skills: { orderBy: { order: "asc" } },
      materials: true,
    },
  });
  if (!profession) throw new Error("Профессия не найдена");

  // Удаляем прежний roadmap по этой профессии (идемпотентность)
  await prisma.roadmap.deleteMany({
    where: { userId, professionSlug: slug },
  });

  const materialBySkill = new Map(
    profession.materials.map((m) => [m.skillName, m]),
  );

  const roadmap = await prisma.roadmap.create({
    data: {
      userId,
      professionSlug: slug,
      title: `Путь: ${profession.title}`,
      stages: {
        create: GRADE_STAGES.map((stage, si) => {
          const stageSkills = profession.skills.filter(
            (s) => s.grade === stage.key,
          );
          return {
            title: stage.title,
            order: si,
            steps: {
              create: stageSkills.map((s, idx) => {
                const mat = materialBySkill.get(s.name);
                return {
                  skillName: s.name,
                  order: idx,
                  materialTitle: mat?.title ?? null,
                  materialUrl: mat?.url ?? null,
                };
              }),
            },
          };
        }),
      },
    },
  });

  await prisma.profile.update({
    where: { userId },
    data: { targetProfession: slug },
  });

  return roadmap;
}
