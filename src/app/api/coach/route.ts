import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { coachReply, type ChatTurn } from "@/lib/ai";
import { PROFESSION_TITLES } from "@/lib/orientation";
import {
  detectCompletedSkills,
  motivationalBlock,
  buildCareerPortrait,
} from "@/lib/progress";

const schema = z.object({ message: z.string().trim().min(1).max(2000) });

const FREE_DAILY_LIMIT = 10;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
  }

  // Сессия чата (одна на пользователя для MVP)
  let session = await prisma.chatSession.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  session ??= await prisma.chatSession.create({ data: { userId: user.id } });

  // Лимит сообщений для бесплатного тарифа (монетизация)
  if (user.plan === "free") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await prisma.chatMessage.count({
      where: { session: { userId: user.id }, role: "user", createdAt: { gte: since } },
    });
    if (count >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: "Достигнут дневной лимит бесплатного тарифа. Оформите подписку, чтобы продолжить." },
        { status: 429 },
      );
    }
  }

  await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "user", content: parsed.data.message },
  });

  // ФТ-7.1–7.4 — передача прогресса через чат: отмечаем навыки и обновляем roadmap
  let progressNote = "";
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { stages: { include: { steps: true } } },
  });
  if (roadmap) {
    const steps = roadmap.stages.flatMap((s) => s.steps);
    const matched = detectCompletedSkills(
      parsed.data.message,
      steps.map((s) => s.skillName),
    );
    if (matched.length > 0) {
      const toMark = steps.filter(
        (s) => matched.includes(s.skillName) && s.status !== "done",
      );
      await Promise.all(
        toMark.map((s) =>
          prisma.roadmapStep.update({ where: { id: s.id }, data: { status: "done" } }),
        ),
      );
      const done =
        steps.filter((s) => s.status === "done").length + toMark.length;
      const next = steps.find(
        (s) => s.status === "not_started" && !matched.includes(s.skillName),
      );
      progressNote = motivationalBlock(done, steps.length, next?.skillName);

      // ФТ-7.4 — обновляем карьерный портрет
      const portrait = buildCareerPortrait({
        targetTitle: roadmap.title.replace(/^Путь:\s*/, ""),
        doneSkills: done,
        totalSkills: steps.length,
        strongTopics: [],
        weakTopics: [],
      });
      await prisma.profile.update({
        where: { userId: user.id },
        data: { careerPortrait: portrait },
      });
    }
  }

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const { content, source } = await coachReply(
    history.map((m) => ({ role: m.role as ChatTurn["role"], content: m.content })),
    {
      userName: user.name.split(" ")[0],
      targetProfession: profile?.targetProfession
        ? (PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession)
        : undefined,
      experienceMonths: profile?.experienceMonths,
    },
  );

  // ФТ-7.3 — мотивационный блок добавляется к ответу при обновлении прогресса
  const finalContent = progressNote ? `${progressNote}\n\n${content}` : content;

  const saved = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content: finalContent },
  });

  return NextResponse.json({
    ok: true,
    reply: { id: saved.id, content: finalContent, createdAt: saved.createdAt },
    source,
  });
}
