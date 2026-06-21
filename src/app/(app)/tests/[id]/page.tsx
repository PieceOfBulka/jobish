import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRetake } from "@/lib/theory";
import { TheoryQuiz } from "@/components/TheoryQuiz";
import { FrozenCard } from "@/components/FrozenCard";
import type { AttemptPayload } from "@/app/api/tests/submit/route";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function TakeTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attemptId?: string }>;
}) {
  const t = await getTranslations("tests");
  const { id } = await params;
  const { attemptId } = await searchParams;
  const user = (await getCurrentUser())!;

  const test = await prisma.theoryTest.findUnique({
    where: { id },
    include: {
      profession: true,
      questions: { orderBy: { order: "asc" } },
    },
  });
  if (!test) notFound();

  // Режим просмотра сохранённой попытки из истории
  if (attemptId) {
    const record = await prisma.testAttempt.findFirst({
      where: { id: Number(attemptId), userId: user.id, testId: id },
    });
    if (record) {
      const payload = JSON.parse(record.resultPayload) as AttemptPayload;
      const dateStr = new Date(record.completedAt).toLocaleDateString("ru-RU", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      return (
        <div className="container-page max-w-3xl py-8">
          <Link href="/profile" className="text-sm text-slate-500 hover:text-brand-600">
            ← История тестов
          </Link>
          <div className="mt-4 card p-8">
            <p className="mb-1 text-xs text-slate-400">Попытка от {dateStr}</p>
            <h1 className="text-xl font-bold text-ink">{payload.testTitle}</h1>
            <div className="mt-4 flex items-center gap-3">
              <span className={`grid h-12 w-12 place-items-center rounded-xl ${payload.passed ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                {payload.passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              </span>
              <div>
                <p className="text-2xl font-bold text-ink">{payload.score}%</p>
                <p className="text-sm text-slate-500">{payload.correctCount} из {payload.total} верных</p>
              </div>
            </div>
            {payload.strongTopics.length > 0 && (
              <div className="mt-5">
                <p className="text-sm font-medium text-emerald-700">Сильные темы</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {payload.strongTopics.map((t) => <span key={t} className="badge bg-emerald-50 text-emerald-700">{t}</span>)}
                </div>
              </div>
            )}
            {payload.weakTopics.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-amber-700">Слабые темы</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {payload.weakTopics.map((t) => <span key={t} className="badge bg-amber-50 text-amber-700">{t}</span>)}
                </div>
              </div>
            )}
            <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{payload.conclusion}</p>
            {payload.recommendations.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-ink">Рекомендации</p>
                <ul className="mt-2 space-y-1.5">
                  {payload.recommendations.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
                        {r.title} <span className="text-xs text-slate-400">· {r.provider}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Link href="/profile" className="btn-outline">← К профилю</Link>
              <Link href={`/tests/${id}`} className="btn-primary">Пройти снова</Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // Обычный режим — прохождение теста
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
