import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrientationQuiz } from "@/components/OrientationQuiz";
import {
  ORIENTATION_QUESTIONS,
  hasStrongMatch,
  type ProfessionMatch,
} from "@/lib/orientation";

export const metadata = { title: "Профориентация — Jobish" };

export default async function OrientationPage() {
  const user = (await getCurrentUser())!;
  const existing = await prisma.orientationResult.findUnique({
    where: { userId: user.id },
  });

  const matches: ProfessionMatch[] | null = existing
    ? (JSON.parse(existing.topMatches) as ProfessionMatch[])
    : null;
  const previousMatches: ProfessionMatch[] | null =
    existing?.previousTopMatches
      ? (JSON.parse(existing.previousTopMatches) as ProfessionMatch[])
      : null;

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        Профориентационный тест
      </h1>
      <p className="mt-1 text-slate-600">
        {matches
          ? "Вы уже проходили тест — вот ваши подходящие профессии. Можно пройти заново."
          : `Ответьте на ${ORIENTATION_QUESTIONS.length} вопросов о ваших интересах — подберём подходящие профессии с уровнем соответствия.`}
      </p>
      <div className="mt-6">
        <OrientationQuiz
          done={Boolean(existing)}
          initialMatches={matches}
          initialPreviousMatches={previousMatches}
          initialHasStrong={matches ? hasStrongMatch(matches) : true}
        />
      </div>
    </div>
  );
}
