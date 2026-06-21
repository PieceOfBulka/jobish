import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROFESSION_TITLES } from "@/lib/orientation";
import { ProfileForm } from "@/components/ProfileForm";
import { GoalsSection } from "@/components/GoalsSection";
import { Route, ClipboardList } from "lucide-react";
import type { AttemptPayload } from "@/app/api/tests/submit/route";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("profile") };
}

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  const user = (await getCurrentUser())!;
  const [profile, goals, testHistory] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.careerGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.testAttempt.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "desc" },
      include: { test: { select: { id: true, title: true } } },
    }),
  ]);

  const targetTitle = profile?.targetProfession
    ? (PROFESSION_TITLES[profile.targetProfession] ?? profile.targetProfession)
    : null;

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-slate-600">{user.email}</p>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
        <div className="flex items-center gap-3">
          <Route className="h-6 w-6" />
          <div>
            <p className="text-sm text-brand-100">{t("currentTrack")}</p>
            <p className="font-semibold">{targetTitle ?? t("notSelected")}</p>
          </div>
        </div>
        <Link href={targetTitle ? "/roadmap" : "/professions"} className="btn bg-white text-brand-700 hover:bg-brand-50">
          {targetTitle ? t("openRoadmap") : t("chooseTrack")}
        </Link>
      </div>

      <div className="mt-6">
        <ProfileForm
          initial={{
            name: user.name,
            telegramNick: profile?.telegramNick ?? "",
            age: profile?.age != null ? String(profile.age) : "",
            experienceMonths: String(profile?.experienceMonths ?? 0),
            educationPlace: profile?.educationPlace ?? "",
            gradeLevel: profile?.gradeLevel ?? "",
            currentSpecialty: profile?.currentSpecialty ?? "",
            currentPosition: profile?.currentPosition ?? "",
            preparationLevel: profile?.preparationLevel ?? "",
            salaryExpectation: profile?.salaryExpectation != null ? String(profile.salaryExpectation) : "",
            skills: profile?.skills ? JSON.parse(profile.skills).join(", ") : "",
            bio: profile?.bio ?? "",
            resumeFileName: profile?.resumeFileName ?? null,
          }}
        />
      </div>

      <div className="mt-6">
        <GoalsSection
          initial={goals.map((g) => ({
            id: g.id,
            title: g.title,
            horizon: g.horizon,
            rationale: g.rationale,
          }))}
          hasTrack={Boolean(profile?.targetProfession)}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-semibold text-ink">История тестов</h2>
        </div>
        {testHistory.length === 0 ? (
          <p className="text-sm text-slate-500">Вы ещё не проходили тесты</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Тест</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Результат</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Дата</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testHistory.map((attempt) => {
                  const payload = JSON.parse(attempt.resultPayload) as AttemptPayload;
                  const dateStr = new Date(attempt.completedAt).toLocaleDateString("ru-RU", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                  });
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-ink">{attempt.test.title}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${payload.passed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {payload.score}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{dateStr}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/tests/${attempt.test.id}?attemptId=${attempt.id}`}
                          className="text-brand-600 hover:underline"
                        >
                          Посмотреть результат
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
