import "server-only";
import { prisma } from "./prisma";
import {
  GRADE_STAGES,
  stageDescription,
  estimateForSkill,
  type Grade,
  type SkillType,
} from "./roadmap-content";

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
      currentStatus: `Сейчас вы в начале пути в направлении «${profession.title}». У вас есть мотивация развиваться, и платформа поможет двигаться структурно. Карта разбита на этапы по грейдам — от базовых навыков к экспертным. Отмечайте прогресс и переходите к материалам прямо с карты.`,
      targetStatus: `После прохождения всех этапов вы освоите ключевые hard- и soft-навыки профессии «${profession.title}», сможете претендовать на позиции уровня Middle и выше, соберёте портфолио и будете уверенно проходить собеседования.`,
      stages: {
        create: GRADE_STAGES.map((stage, si) => {
          const stageSkills = profession.skills.filter(
            (s) => s.grade === stage.key,
          );
          return {
            title: stage.title,
            description: stageDescription(
              stage.key,
              profession.title,
              stageSkills.map((s) => s.name),
            ),
            order: si,
            steps: {
              create: stageSkills.map((s, idx) => {
                const mat = materialBySkill.get(s.name);
                const type = s.type as SkillType;
                return {
                  skillName: s.name,
                  skillType: type,
                  order: idx,
                  // метаданные материала — только если материал реально есть
                  materialTitle: mat?.title ?? null,
                  materialUrl: mat?.url ?? null,
                  materialAuthor: mat?.provider ?? null,
                  materialType: mat ? "онлайн-курс" : null,
                  materialDuration: null,
                  materialRating: null,
                  estimateHours: estimateForSkill(type, stage.key as Grade),
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
