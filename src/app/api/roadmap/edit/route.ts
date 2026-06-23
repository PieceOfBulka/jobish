import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveInOrder, nextOrder } from "@/lib/order";
import {
  stageDescription,
  estimateForSkill,
  type Grade,
  type SkillType,
} from "@/lib/roadmap-content";
import { normalizeCourseLink } from "@/lib/validation";

const STAGE_GRADES: Grade[] = ["junior", "middle", "senior"];

// Конструктор дорожной карты (ФТ-4.2 / ФТ-4.3): CRUD этапов и шагов.
async function ownsRoadmap(userId: string, roadmapId: string) {
  const r = await prisma.roadmap.findUnique({ where: { id: roadmapId } });
  return r?.userId === userId ? r : null;
}
async function ownsStage(userId: string, stageId: string) {
  const s = await prisma.roadmapStage.findUnique({
    where: { id: stageId },
    include: { roadmap: true },
  });
  return s && s.roadmap.userId === userId ? s : null;
}
async function ownsStep(userId: string, stepId: string) {
  const s = await prisma.roadmapStep.findUnique({
    where: { id: stepId },
    include: { stage: { include: { roadmap: true } } },
  });
  return s && s.stage.roadmap.userId === userId ? s : null;
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  const ok = () => NextResponse.json({ ok: true });
  const notFound = () => NextResponse.json({ error: "Не найдено" }, { status: 404 });

  switch (action) {
    case "set_meta": {
      const r = await ownsRoadmap(userId, body.roadmapId);
      if (!r) return notFound();
      await prisma.roadmap.update({
        where: { id: r.id },
        data: {
          currentStatus: body.currentStatus ?? undefined,
          targetStatus: body.targetStatus ?? undefined,
        },
      });
      return ok();
    }
    case "add_stage": {
      const r = await ownsRoadmap(userId, body.roadmapId);
      if (!r) return notFound();
      const title = String(body.title ?? "").trim();
      if (!title) return NextResponse.json({ error: "Укажите название" }, { status: 400 });
      const stages = await prisma.roadmapStage.findMany({ where: { roadmapId: r.id } });
      await prisma.roadmapStage.create({
        data: { roadmapId: r.id, title, order: nextOrder(stages) },
      });
      return ok();
    }
    case "rename_stage": {
      const s = await ownsStage(userId, body.stageId);
      if (!s) return notFound();
      const title = String(body.title ?? "").trim();
      if (!title) return NextResponse.json({ error: "Укажите название" }, { status: 400 });
      await prisma.roadmapStage.update({ where: { id: s.id }, data: { title } });
      return ok();
    }
    case "delete_stage": {
      const s = await ownsStage(userId, body.stageId);
      if (!s) return notFound();
      await prisma.roadmapStage.delete({ where: { id: s.id } });
      return ok();
    }
    case "add_step": {
      const s = await ownsStage(userId, body.stageId);
      if (!s) return notFound();
      const skillName = String(body.skillName ?? "").trim();
      if (!skillName) return NextResponse.json({ error: "Укажите навык" }, { status: 400 });
      const link = normalizeCourseLink(body.materialTitle, body.materialUrl);
      if (!link.ok) return NextResponse.json({ error: link.error }, { status: 400 });
      const steps = await prisma.roadmapStep.findMany({ where: { stageId: s.id } });
      await prisma.roadmapStep.create({
        data: {
          stageId: s.id,
          skillName,
          order: nextOrder(steps),
          materialTitle: link.title,
          materialUrl: link.url,
          materialType: link.url ? "онлайн-курс" : null,
        },
      });
      return ok();
    }
    case "edit_step": {
      const step = await ownsStep(userId, body.stepId);
      if (!step) return notFound();
      const skillName = body.skillName != null ? String(body.skillName).trim() : undefined;
      if (skillName === "") {
        return NextResponse.json({ error: "Укажите навык" }, { status: 400 });
      }
      const hasLinkFields =
        body.materialTitle !== undefined || body.materialUrl !== undefined;
      let materialTitle = step.materialTitle;
      let materialUrl = step.materialUrl;
      let materialType = step.materialType;
      if (hasLinkFields) {
        const link = normalizeCourseLink(
          body.materialTitle ?? step.materialTitle,
          body.materialUrl ?? step.materialUrl,
        );
        if (!link.ok) return NextResponse.json({ error: link.error }, { status: 400 });
        materialTitle = link.title ?? null;
        materialUrl = link.url ?? null;
        materialType = link.url ? "онлайн-курс" : null;
      }
      await prisma.roadmapStep.update({
        where: { id: step.id },
        data: {
          skillName,
          materialTitle,
          materialUrl,
          materialType,
        },
      });
      return ok();
    }
    case "delete_step": {
      const step = await ownsStep(userId, body.stepId);
      if (!step) return notFound();
      await prisma.roadmapStep.delete({ where: { id: step.id } });
      return ok();
    }
    case "set_status": {
      const step = await ownsStep(userId, body.stepId);
      if (!step) return notFound();
      const status = body.status;
      if (!["not_started", "in_progress", "done"].includes(status)) {
        return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
      }
      await prisma.roadmapStep.update({ where: { id: step.id }, data: { status } });
      return ok();
    }
    case "move_step": {
      const step = await ownsStep(userId, body.stepId);
      if (!step) return notFound();
      const siblings = await prisma.roadmapStep.findMany({
        where: { stageId: step.stageId },
      });
      const updates = moveInOrder(siblings, step.id, body.dir);
      await Promise.all(
        updates.map((u) =>
          prisma.roadmapStep.update({ where: { id: u.id }, data: { order: u.order } }),
        ),
      );
      return ok();
    }
    case "refresh_roadmap": {
      // Неразрушающая пересборка: добавляет материалы (вкл. soft-курсы), бейджи
      // hard/soft, описания этапов и часы в существующую карту, не трогая прогресс.
      const r = await ownsRoadmap(userId, body.roadmapId);
      if (!r) return notFound();
      const roadmap = await prisma.roadmap.findUnique({
        where: { id: r.id },
        include: { stages: { orderBy: { order: "asc" }, include: { steps: true } } },
      });
      const profession = await prisma.profession.findUnique({
        where: { slug: r.professionSlug },
        include: { materials: true, skills: true },
      });
      if (!roadmap || !profession) return notFound();

      const matBySkill = new Map(profession.materials.map((m) => [m.skillName, m]));
      const typeBySkill = new Map(profession.skills.map((s) => [s.name, s.type]));

      for (let si = 0; si < roadmap.stages.length; si++) {
        const stage = roadmap.stages[si];
        const grade = STAGE_GRADES[si] ?? "senior";
        if (!stage.description) {
          await prisma.roadmapStage.update({
            where: { id: stage.id },
            data: {
              description: stageDescription(
                grade,
                profession.title,
                stage.steps.map((s) => s.skillName),
              ),
            },
          });
        }
        for (const step of stage.steps) {
          const type = (step.skillType ?? typeBySkill.get(step.skillName) ?? null) as SkillType | null;
          const mat = step.materialUrl ? null : matBySkill.get(step.skillName);
          await prisma.roadmapStep.update({
            where: { id: step.id },
            data: {
              skillType: type ?? undefined,
              estimateHours: estimateForSkill(type, grade),
              // материал добавляем только в пустые шаги, ручные ссылки не трогаем
              ...(mat
                ? {
                    materialTitle: mat.title,
                    materialUrl: mat.url,
                    materialAuthor: mat.provider,
                    materialType: "онлайн-курс",
                  }
                : {}),
            },
          });
        }
      }
      return ok();
    }
    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
}
