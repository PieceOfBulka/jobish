import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoalsSection } from "@/components/GoalsSection";
import { JobAlignmentSurvey } from "@/components/JobAlignmentSurvey";
import type { AlignmentResult } from "@/lib/job-alignment";

export const metadata = { title: "Карьерные цели — Jobish" };

export default async function GoalsPage() {
  const user = (await getCurrentUser())!;
  const [profile, goals, orientation] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.careerGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.orientationResult.findUnique({ where: { userId: user.id } }),
  ]);

  let alignmentResult: AlignmentResult | null = null;
  if (profile?.jobAlignmentResult) {
    try {
      alignmentResult = JSON.parse(profile.jobAlignmentResult) as AlignmentResult;
    } catch {
      alignmentResult = null;
    }
  }

  const hasContext = Boolean(profile?.targetProfession || orientation);

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Карьерные цели</h1>
      <p className="mt-1 text-slate-600">
        Долгосрочные цели на основе профориентации, трека и прогресса. Диагностика соответствия текущей работы.
      </p>

      {profile?.careerPortrait && (
        <div className="mt-6 card p-5">
          <h2 className="text-sm font-semibold text-brand-700">Карьерный портрет</h2>
          <p className="mt-2 text-sm text-slate-600">{profile.careerPortrait}</p>
        </div>
      )}

      <div className="mt-6">
        <GoalsSection
          initial={goals.map((g) => ({
            id: g.id,
            title: g.title,
            horizon: g.horizon,
            rationale: g.rationale,
          }))}
          hasTrack={hasContext}
        />
      </div>

      <div className="mt-6">
        <JobAlignmentSurvey
          initialResult={alignmentResult}
          currentPosition={profile?.currentPosition ?? null}
        />
      </div>
    </div>
  );
}
