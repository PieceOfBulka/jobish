import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextStreak, visitedToday } from "@/lib/streak";
import { PROFESSION_TITLES } from "@/lib/orientation";
import {
  Flame,
  Compass,
  Map,
  MessageSquareHeart,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("dashboard") };
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const user = (await getCurrentUser())!;

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  let streak = profile?.streakDays ?? 0;
  if (profile && !visitedToday(profile.lastVisit)) {
    streak = nextStreak(profile.streakDays, profile.lastVisit);
    await prisma.profile.update({
      where: { userId: user.id },
      data: { streakDays: streak, lastVisit: new Date() },
    });
  }

  const [roadmap, orientation, lastAttempt] = await Promise.all([
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
  ]);

  const allSteps = roadmap?.stages.flatMap((s) => s.steps) ?? [];
  const doneSteps = allSteps.filter((s) => s.status === "done").length;
  const progress = allSteps.length
    ? Math.round((doneSteps / allSteps.length) * 100)
    : 0;

  const targetTitle = profile?.targetProfession
    ? (PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession)
    : null;

  return (
    <div className="container-page py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            {t("greeting", { name: user.name.split(" ")[0] })}
          </h1>
          <p className="mt-1 text-slate-600">
            {targetTitle
              ? t("trackActive", { track: targetTitle })
              : t("startOrientation")}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3">
          <Flame className="h-7 w-7 text-orange-500" />
          <div>
            <p className="text-xl font-bold text-ink">{streak}</p>
            <p className="text-xs text-slate-500">{t("streakDays")}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Map className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold text-ink">{progress}%</span>
          </div>
          <p className="mt-3 text-sm font-medium text-ink">{t("roadmapProgress")}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {roadmap
              ? t("skillsProgress", { done: doneSteps, total: allSteps.length })
              : t("roadmapNotCreated")}
          </p>
        </div>

        <div className="card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-400/15 text-accent-600">
            <Compass className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">{t("orientation")}</p>
          <p className="mt-1 text-sm text-slate-500">
            {orientation ? t("orientationDone") : t("orientationNotDone")}
          </p>
          <Link href="/orientation" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            {orientation ? t("retake") : t("takeTest")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="card p-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <ClipboardCheck className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink">{t("lastTest")}</p>
          {lastAttempt ? (
            <p className="mt-1 text-sm text-slate-500">
              {lastAttempt.test.title}: {lastAttempt.score}%{" "}
              {lastAttempt.passed ? t("testPassed") : t("testFailed")}
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-500">{t("noTestsYet")}</p>
          )}
          <Link href="/tests" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
            {t("toTests")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Link href="/coach" className="card card-hover flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
            <MessageSquareHeart className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-ink">{t("talkToCoach")}</h3>
            <p className="mt-0.5 text-sm text-slate-600">{t("talkToCoachDesc")}</p>
          </div>
        </Link>
        <Link href={roadmap ? "/roadmap" : "/professions"} className="card card-hover flex items-center gap-4 p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-accent-500 text-white">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-semibold text-ink">
              {roadmap ? t("openRoadmap") : t("chooseTrack")}
            </h3>
            <p className="mt-0.5 text-sm text-slate-600">
              {roadmap ? t("openRoadmapDesc") : t("chooseTrackDesc")}
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
