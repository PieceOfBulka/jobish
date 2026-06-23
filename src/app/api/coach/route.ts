import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { coachReply, type ChatTurn } from "@/lib/ai";
import { PROFESSION_TITLES } from "@/lib/orientation";
import {
  detectSkillProgress,
  motivationalBlock,
  buildCareerPortrait,
} from "@/lib/progress";
import { fetchHhSummary, hhSummaryText } from "@/lib/hh";
import { formatMarketContext, type MarketPanelData } from "@/lib/market";

const MARKET_INTENT =
  /зарплат|зп |ден[ьге]|зараб|доход|оклад|ваканс|рынок|востребован|грейд|джун|мидл|сеньор|junior|middle|senior|сколько (платят|получают)|аналитик/i;

const schema = z.object({
  message: z.string().trim().min(1).max(2000),
  sessionId: z.string().optional(),
});

const FREE_DAILY_LIMIT = 10;

async function collectTheoryTopics(userId: string) {
  const attempts = await prisma.theoryAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const weak = new Set<string>();
  const strong = new Set<string>();
  for (const a of attempts) {
    try {
      for (const t of JSON.parse(a.weakTopics ?? "[]") as string[]) weak.add(t);
    } catch {
      /* ignore */
    }
    if (a.passed && a.score >= 80) {
      try {
        const test = await prisma.theoryTest.findUnique({ where: { id: a.testId } });
        if (test?.topic) strong.add(test.topic);
      } catch {
        /* ignore */
      }
    }
  }
  return {
    weakTopics: [...weak].slice(0, 5),
    strongTopics: [...strong].slice(0, 5),
  };
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ messages: [] });
  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    messages: messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Пустое сообщение" }, { status: 400 });
  }

  let session = parsed.data.sessionId
    ? await prisma.chatSession.findUnique({ where: { id: parsed.data.sessionId } })
    : null;
  if (session && session.userId !== user.id) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }
  session ??= await prisma.chatSession.create({ data: { userId: user.id } });

  if (session.title === "Новый диалог") {
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { title: parsed.data.message.slice(0, 40) },
    });
  }

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

  let progressNote = "";
  let roadmapUpdated = false;
  const roadmap = await prisma.roadmap.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { stages: { include: { steps: true } } },
  });
  const { weakTopics, strongTopics } = await collectTheoryTopics(user.id);

  if (roadmap) {
    const steps = roadmap.stages.flatMap((s) => s.steps);
    const { completed, inProgress } = detectSkillProgress(
      parsed.data.message,
      steps.map((s) => s.skillName),
    );

    if (completed.length > 0 || inProgress.length > 0) {
      const toDone = steps.filter(
        (s) => completed.includes(s.skillName) && s.status !== "done",
      );
      const toProgress = steps.filter(
        (s) =>
          inProgress.includes(s.skillName) &&
          s.status === "not_started",
      );
      await Promise.all([
        ...toDone.map((s) =>
          prisma.roadmapStep.update({ where: { id: s.id }, data: { status: "done" } }),
        ),
        ...toProgress.map((s) =>
          prisma.roadmapStep.update({ where: { id: s.id }, data: { status: "in_progress" } }),
        ),
      ]);
      roadmapUpdated = toDone.length > 0 || toProgress.length > 0;

      const done =
        steps.filter((s) => s.status === "done").length + toDone.length;
      const next = steps.find(
        (s) =>
          s.status === "not_started" &&
          !completed.includes(s.skillName) &&
          !inProgress.includes(s.skillName),
      );
      progressNote = motivationalBlock(done, steps.length, next?.skillName);

      const portrait = buildCareerPortrait({
        targetTitle: roadmap.title.replace(/^Путь:\s*/, ""),
        doneSkills: done,
        totalSkills: steps.length,
        strongTopics,
        weakTopics,
      });

      const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
      const statusUpdate =
        pct >= 100
          ? `Вы завершили карту развития по «${roadmap.title.replace(/^Путь:\s*/, "")}». Готовы к собеседованиям и практике на реальных задачах.`
          : pct >= 50
            ? `Вы на середине пути (${pct}%): освоены ключевые базовые навыки, продолжайте углубляться.`
            : `Вы в начале пути (${pct}%): заложен фундамент, следующий фокус — ${next?.skillName ?? "базовые навыки"}.`;

      await prisma.profile.update({
        where: { userId: user.id },
        data: { careerPortrait: portrait },
      });
      await prisma.roadmap.update({
        where: { id: roadmap.id },
        data: { currentStatus: statusUpdate },
      });
    }
  }

  const history = await prisma.chatMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  const targetTitle = profile?.targetProfession
    ? (PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession)
    : undefined;

  let marketData: string | undefined;
  let marketPanel: MarketPanelData | null = null;

  if (MARKET_INTENT.test(parsed.data.message)) {
    const pieces: string[] = [];
    const slug = profile?.targetProfession;

    if (slug) {
      const prof = await prisma.profession.findUnique({
        where: { slug },
        include: { market: true },
      });
      if (prof?.market) {
        const topCompanies = JSON.parse(prof.market.topCompanies) as {
          name: string;
          salary: number;
          hiring: string;
        }[];
        const salaryTrend = JSON.parse(prof.market.salaryTrend) as MarketPanelData["salaryTrend"];
        marketPanel = {
          title: prof.title,
          demandLevel: prof.market.demandLevel,
          openVacancies: prof.market.openVacancies,
          salaryJunior: prof.market.salaryJunior,
          salaryMiddle: prof.market.salaryMiddle,
          salarySenior: prof.market.salarySenior,
          topCompanies,
          salaryTrend,
        };
        pieces.push(formatMarketContext(marketPanel));
      }
    }

    const summary = await fetchHhSummary(targetTitle ?? parsed.data.message);
    if (summary && summary.found > 0) {
      const live = hhSummaryText(summary);
      pieces.push(live);
      if (marketPanel) marketPanel.liveSummary = live;
    }

    if (pieces.length) marketData = pieces.join(" ");
  }

  const { content, source } = await coachReply(
    history.map((m) => ({ role: m.role as ChatTurn["role"], content: m.content })),
    {
      userName: user.name.split(" ")[0],
      targetProfession: targetTitle,
      experienceMonths: profile?.experienceMonths,
      marketData,
    },
  );

  const finalContent = progressNote ? `${progressNote}\n\n${content}` : content;

  const saved = await prisma.chatMessage.create({
    data: { sessionId: session.id, role: "assistant", content: finalContent },
  });

  return NextResponse.json({
    ok: true,
    sessionId: session.id,
    reply: { id: saved.id, content: finalContent, createdAt: saved.createdAt },
    source,
    marketPanel,
    roadmapUpdated,
    careerPortrait: profile?.careerPortrait ?? null,
  });
}