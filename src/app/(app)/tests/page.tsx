import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canRetake } from "@/lib/theory";
import { PersonalTestButton } from "@/components/PersonalTestButton";
import { ClipboardCheck, Lock, CheckCircle2, ArrowRight } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("tests") };
}

export default async function TestsPage() {
  const t = await getTranslations("tests");
  const user = (await getCurrentUser())!;
  const tests = await prisma.theoryTest.findMany({
    where: { isPersonal: false },
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
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-slate-600">{t("subtitle")}</p>

      <div className="mt-5">
        <PersonalTestButton />
        <p className="mt-2 text-xs text-slate-400">{t("personalHint")}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => {
          const last = test.attempts[0];
          const frozen = last ? !canRetake(last.frozenUntil, last.extraTries) : false;
          const passed = last?.passed ?? false;
          return (
            <div key={test.id} className="card flex flex-col p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <ClipboardCheck className="h-5 w-5" />
                </span>
                {passed ? (
                  <span className="badge bg-emerald-50 text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {t("passed")}
                  </span>
                ) : frozen ? (
                  <span className="badge bg-red-50 text-red-600">
                    <Lock className="h-3.5 w-3.5" /> {t("frozen")}
                  </span>
                ) : last ? (
                  <span className="badge bg-amber-50 text-amber-700">{last.score}%</span>
                ) : null}
              </div>
              <h3 className="mt-4 font-semibold text-ink">{test.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">
                {t("testMeta", { profession: test.profession.title, count: test._count.questions })}
              </p>
              <Link href={`/tests/${test.id}`} className="btn-outline mt-4">
                {last ? t("retake") : t("start")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
