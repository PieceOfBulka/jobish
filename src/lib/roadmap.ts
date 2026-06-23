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

  await prisma.roadmap.deleteMany({
    where: { userId, professionSlug: slug },
  });

  const materialBySkill = new Map(
    profession.materials.map((m) => [m.skillName, m]),
  );

  const fallbackMaterial = (skillName: string, type: string) => {
    if (type === "soft") {
      return {
        title: `Soft skills: ${skillName}`,
        url: "https://habr.com/ru/hubs/career/",
        provider: "Habr Career",
      };
    }
    return {
      title: `Курс по «${skillName}»`,
      url: `https://stepik.org/catalog/search?query=${encodeURIComponent(skillName)}`,
      provider: "Stepik",
    };
  };

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
                const mat = materialBySkill.get(s.name) ?? fallbackMaterial(s.name, s.type);
                const type = s.type as SkillType;
                return {
                  skillName: s.name,
                  skillType: type,
                  order: idx,
                  materialTitle: mat.title,
                  materialUrl: mat.url,
                  materialAuthor: mat.provider,
                  materialType: s.type === "soft" ? "статья" : "онлайн-курс",
                  materialDuration: s.type === "soft" ? 45 : 90,
                  materialRating: materialBySkill.has(s.name) ? 4.5 : null,
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
