import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { moveInOrder, nextOrder } from "@/lib/order";

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
      const steps = await prisma.roadmapStep.findMany({ where: { stageId: s.id } });
      await prisma.roadmapStep.create({
        data: { stageId: s.id, skillName, order: nextOrder(steps) },
      });
      return ok();
    }
    case "edit_step": {
      const step = await ownsStep(userId, body.stepId);
      if (!step) return notFound();
      await prisma.roadmapStep.update({
        where: { id: step.id },
        data: {
          skillName: body.skillName ? String(body.skillName).trim() : undefined,
          materialTitle: body.materialTitle ?? undefined,
          materialUrl: body.materialUrl ?? undefined,
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
    default:
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
}
