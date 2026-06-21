import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROFESSION_TITLES } from "@/lib/orientation";
import { ProfileForm } from "@/components/ProfileForm";
import { GoalsSection } from "@/components/GoalsSection";
import { Route } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("profile") };
}

export default async function ProfilePage() {
  const t = await getTranslations("profile");
  const user = (await getCurrentUser())!;
  const [profile, goals] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.careerGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
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
    </div>
  );
}
