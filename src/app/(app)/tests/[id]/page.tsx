import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRetake } from "@/lib/theory";
import { TheoryQuiz } from "@/components/TheoryQuiz";
import { FrozenCard } from "@/components/FrozenCard";

export default async function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("tests");
  const { id } = await params;
  const user = (await getCurrentUser())!;

  const test = await prisma.theoryTest.findUnique({
    where: { id },
    include: {
      profession: true,
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!test) notFound();

  const last = await prisma.theoryAttempt.findFirst({
    where: { userId: user.id, testId: id },
    orderBy: { createdAt: "desc" },
  });

  const frozen = last ? !canRetake(last.frozenUntil, last.extraTries) : false;

  return (
    <div className="container-page max-w-3xl py-8">
      <Link href="/tests" className="text-sm text-slate-500 hover:text-brand-600">
        {t("backToAll")}
      </Link>
      <div className="mt-4">
        {frozen && last?.frozenUntil ? (
          <FrozenCard testId={id} frozenUntil={last.frozenUntil.toISOString()} />
        ) : (
          <TheoryQuiz
            testId={id}
            title={test.title}
            questions={test.questions.map((q) => ({
              id: q.id,
              text: q.text,
              options: JSON.parse(q.options) as string[],
              topic: q.topic,
              type: (q.type ?? "single") as "single" | "multiple" | "scale" | "text",
              weight: q.weight ?? 1.0,
            }))}
          />
        )}
      </div>
    </div>
  );
}
