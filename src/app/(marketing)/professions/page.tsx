import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatRub } from "@/lib/utils";
import { ArrowRight, TrendingUp } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("professions") };
}

const demandColor: Record<string, string> = {
  высокая: "bg-emerald-50 text-emerald-700",
  средняя: "bg-amber-50 text-amber-700",
  низкая: "bg-slate-100 text-slate-600",
};

export default async function ProfessionsPage() {
  const t = await getTranslations("professions");
  const tCommon = await getTranslations("common");
  const professions = await prisma.profession.findMany({
    include: { market: true, _count: { select: { skills: true } } },
    orderBy: { title: "asc" },
  });

  return (
    <div className="container-page py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{t("catalogTitle")}</h1>
        <p className="mt-3 text-slate-600">{t("catalogSubtitle")}</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {professions.map((p) => (
          <Link
            key={p.id}
            href={`/professions/${p.slug}`}
            className="card card-hover group flex flex-col p-6"
          >
            <div className="flex items-center justify-between">
              <span className="badge bg-brand-50 text-brand-700">{p.category}</span>
              {p.market && (
                <span className={`badge ${demandColor[p.market.demandLevel] ?? "bg-slate-100"}`}>
                  <TrendingUp className="h-3 w-3" /> {tCommon("demand", { level: p.market.demandLevel })}
                </span>
              )}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{p.title}</h3>
            <p className="mt-1.5 flex-1 text-sm text-slate-600">{p.summary}</p>
            {p.market && (
              <p className="mt-4 text-sm text-slate-500">
                {tCommon("salary")}{" "}
                <span className="font-semibold text-ink">
                  {formatRub(p.market.salaryJunior)} – {formatRub(p.market.salarySenior)}
                </span>
              </p>
            )}
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-600">
              {tCommon("details")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
