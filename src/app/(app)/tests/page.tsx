import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRetake } from "@/lib/theory";
import { ClipboardCheck, Lock, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata = { title: "Тесты — Jobish" };

export default async function TestsPage() {
  const user = (await getCurrentUser())!;
  const tests = await prisma.theoryTest.findMany({
    include: {
      profession: true,
      _count: { select: { questions: true } },
      attempts: {
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Контрольные тесты</h1>
      <p className="mt-1 text-slate-600">
        Проверьте знания по профилю. Проходной балл — 70%. При неудаче тест
        замораживается на сутки.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((t) => {
          const last = t.attempts[0];
          const frozen = last ? !canRetake(last.frozenUntil, last.extraTries) : false;
          const passed = last?.passed ?? false;
          return (
            <div key={t.id} className="card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                {passed ? (
                  <span className="badge bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> сдан
                  </span>
                ) : frozen ? (
                  <span className="badge bg-red-50 text-red-600">
                    <Lock className="h-3.5 w-3.5" /> заморожен
                  </span>
                ) : last ? (
                  <span className="badge bg-amber-50 text-amber-700">{last.score}%</span>
                ) : null}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{t.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">
                {t.profession.title} · {t._count.questions} вопросов
              </p>
              <Link href={`/tests/${t.id}`} className="btn-outline mt-4">
                {last ? "Пройти снова" : "Начать тест"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
