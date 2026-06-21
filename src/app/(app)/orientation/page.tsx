import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORIENTATION_QUESTIONS } from "@/lib/orientation";
import { OrientationQuiz } from "@/components/OrientationQuiz";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("orientation") };
}

export default async function OrientationPage() {
  const t = await getTranslations("orientationPage");
  const user = (await getCurrentUser())!;
  const existing = await prisma.orientationResult.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="container-page max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-slate-600">
        {t("subtitle", { count: ORIENTATION_QUESTIONS.length })}
      </p>
      <div className="mt-6">
        <OrientationQuiz done={Boolean(existing)} />
      </div>
    </div>
  );
}
