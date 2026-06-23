import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextStreak, visitedToday } from "@/lib/streak";
import { computeBadges, buildReminders } from "@/lib/motivation";
import { PROFESSION_TITLES } from "@/lib/orientation";
import { MotivationBlock } from "@/components/MotivationBlock";
import {
  Flame,
  Compass,
  Map,
  MessageSquareHeart,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata = { title: "Дашборд — Jobish" };

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;

  // Обновляем стрик (ежедневная привычка, ФТ-7)
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  let streak = profile?.streakDays ?? 0;
  if (profile && !visitedToday(profile.lastVisit)) {
    streak = nextStreak(profile.streakDays, profile.lastVisit);
    await prisma.profile.update({
      where: { userId: user.id },
      data: { streakDays: streak, lastVisit: new Date() },
    });
  }

  // US22 — последняя рассылка для сегмента пользователя
  const segments = ["all", user.plan === "free" ? "free" : "paid"];
  const announcement = await prisma.notification.findFirst({
    where: { segment: { in: segments } },
    orderBy: { createdAt: "desc" },
  });

  const [roadmap, orientation, lastAttempt, goalsCount, passedTests] = await Promise.all([
    prisma.roadmap.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { stages: { include: { steps: true } } },
    }),
    prisma.orientationResult.findUnique({ where: { userId: user.id } }),
    prisma.theoryAttempt.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { test: true },
    }),
    prisma.careerGoal.count({ where: { userId: user.id } }),
    prisma.theoryAttempt.count({ where: { userId: user.id, passed: true } }),
  ]);

  const allSteps = roadmap?.stages.flatMap((s) => s.steps) ?? [];
  const doneSteps = allSteps.filter((s) => s.status === "done").length;
  const progress = allSteps.length
    ? Math.round((doneSteps / allSteps.length) * 100)
    : 0;

  const targetTitle = profile?.targetProfession
    ? (PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession)
    : null;

  const badges = computeBadges({
    streakDays: streak,
    roadmapProgress: progress,
    testsPassed: passedTests,
    orientationDone: Boolean(orientation),
    goalsSet: goalsCount > 0,
  });
  const lastTestDaysAgo = lastAttempt
    ? Math.floor((Date.now() - lastAttempt.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;
  const reminders = buildReminders({
    visitedToday: profile ? visitedToday(profile.lastVisit) : true,
    roadmapProgress: progress,
    hasRoadmap: Boolean(roadmap),
    lastTestDaysAgo,
    goalsSet: goalsCount > 0,
  });

  return (
    <div className="container-page py-8">
      {announcement && (
        <div className="mb-6 rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4">
          <p className="text-sm font-semibold text-brand-800">📣 {announcement.title}</p>
          <p className="mt-1 text-sm text-brand-700">{announcement.body}</p>
        </div>
      )}

      {/* Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            Привет, {user.name.split(" ")[0]}! 👋
          </h1>
          <p className="mt-1 text-slate-600">
            {targetTitle
              ? `Ваш трек: ${targetTitle}. Продолжайте в том же духе!`
              : "Начните с профориентации, чтобы найти своё направление."}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3">
          <Flame className="h-7 w-7 text-orange-500" />
          <div>
            <p className="text-xl font-bold text-ink">{streak}</p>
            <p className="text-xs text-slate-500">дней подряд</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Link href={roadmap ? "/roadmap" : "/professions"} className="card card-hover block p-6">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Map className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold text-ink">{progress}%</span>
          </div>
          <p className="mt-3 text-sm font-medium text-ink">Прогресс по карте</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {roadmap ? `${doneSteps} из ${allSteps.length} навыков освоено` : "Карта ещё не создана"}
          </p>
        </Link>

        <Link href="/orientation" className="card card-hover block p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-400/15 text-accent-600">
            <Compass className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">Профориентация</p>
          <p className="mt-1 text-sm text-slate-500">
            {orientation ? "Тест пройден — смотрите рекомендации" : "Ещё не пройдена"}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            {orientation ? "Пройти заново" : "Пройти тест"} <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link href="/tests" className="card card-hover block p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">Последний тест</p>
          {lastAttempt ? (
            <p className="mt-1 text-sm text-slate-500">
              {lastAttempt.test.title}: {lastAttempt.score}%{" "}
              {lastAttempt.passed ? "✓ сдан" : "— нужно подтянуть"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">Ещё не проходили</p>
          )}
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            К тестам <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link href="/coach" className="card card-hover flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
            <MessageSquareHeart className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-ink">Поговорить с AI-коучем</h3>
            <p className="mt-0.5 text-sm text-slate-600">
              Обсудите цели, навыки и следующий шаг развития.
            </p>
          </div>
        </Link>
        <Link href={roadmap ? "/roadmap" : "/professions"} className="card card-hover flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-500 text-white">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-ink">
              {roadmap ? "Открыть карту развития" : "Выбрать трек развития"}
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              {roadmap ? "Отмечайте прогресс и переходите к материалам." : "Выберите профессию и постройте roadmap."}
            </p>
          </div>
        </Link>
      </div>

      {profile?.careerPortrait && (
        <div className="mt-8 card p-5">
          <h2 className="text-sm font-semibold text-brand-700">Карьерный портрет</h2>
          <p className="mt-2 text-sm text-slate-600">{profile.careerPortrait}</p>
        </div>
      )}

      <MotivationBlock badges={badges} reminders={reminders} />
    </div>
  );
}
