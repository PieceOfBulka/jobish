import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrientationQuiz } from "@/components/OrientationQuiz";
import { ORIENTATION_QUESTIONS } from "@/lib/orientation";

export const metadata = { title: "Профориентация — Jobish" };

export default async function OrientationPage() {
  const user = (await getCurrentUser())!;
  const existing = await prisma.orientationResult.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="container-page max-w-3xl py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">
        Профориентационный тест
      </h1>
      <p className="mt-1 text-slate-600">
        Ответьте на {ORIENTATION_QUESTIONS.length} вопросов о ваших интересах —
        подберём подходящие профессии с уровнем соответствия.
      </p>
      <div className="mt-6">
        <OrientationQuiz done={Boolean(existing)} />
      </div>
    </div>
  );
}
