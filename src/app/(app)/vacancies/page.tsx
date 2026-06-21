import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filterVacancies, type Vacancy } from "@/lib/vacancies";
import { isHhEnabled, fetchHhVacancies } from "@/lib/hh";
import { formatRub } from "@/lib/utils";
import { VacancyFilters } from "@/components/VacancyFilters";
import { Briefcase, MapPin, Sparkles, ExternalLink } from "lucide-react";

type Row = Vacancy & { professionTitle: string; url?: string };

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return { title: t("vacancies") };
}

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const t = await getTranslations("vacancies");
  const user = (await getCurrentUser())!;
  const sp = await searchParams;

  const [rows, professions, profile] = await Promise.all([
    prisma.vacancy.findMany({
      include: { profession: { select: { slug: true, title: true } } },
      orderBy: { salaryMax: "desc" },
    }),
    prisma.profession.findMany({ select: { slug: true, title: true }, orderBy: { title: "asc" } }),
    prisma.profile.findUnique({ where: { userId: user.id } }),
  ]);

  const seedAll: Row[] = rows.map((v) => ({
    id: v.id,
    professionSlug: v.profession.slug,
    professionTitle: v.profession.title,
    title: v.title,
    company: v.company,
    city: v.city,
    format: v.format,
    salaryMin: v.salaryMin,
    salaryMax: v.salaryMax,
    experience: v.experience,
    employment: v.employment,
    url: v.url || undefined,
  }));

  const noFilters = Object.values(sp).every((v) => !v);
  const personalized = noFilters && Boolean(profile?.targetProfession);
  const targetSlug = sp.professionSlug || (personalized ? profile?.targetProfession ?? undefined : undefined);
  const targetTitle = professions.find((p) => p.slug === targetSlug)?.title;

  const salaryFrom = sp.salaryFrom ? Number(sp.salaryFrom) : undefined;
  const salaryTo = sp.salaryTo ? Number(sp.salaryTo) : undefined;
  const experienceMax = sp.experienceMax ? Number(sp.experienceMax) : undefined;

  let filtered: Row[] | null = null;
  let live = false;
  if (isHhEnabled() && targetTitle) {
    const items = await fetchHhVacancies({
      text: targetTitle,
      city: sp.city || undefined,
      salaryFrom,
      experienceMax,
      employment: sp.employment || undefined,
      format: sp.format || undefined,
      perPage: 30,
    });
    if (items && items.length > 0) {
      const liveRows: Row[] = items.map((v) => ({ ...v, professionSlug: targetSlug!, professionTitle: targetTitle }));
      filtered = filterVacancies(liveRows, {
        company: sp.company || undefined,
        format: sp.format || undefined,
        salaryTo,
      });
      live = true;
    }
  }

  if (!filtered) {
    filtered = filterVacancies(seedAll, {
      professionSlug: targetSlug,
      city: sp.city || undefined,
      company: sp.company || undefined,
      format: sp.format || undefined,
      employment: sp.employment || undefined,
      salaryFrom,
      salaryTo,
      experienceMax,
    });
  }

  const cities = [...new Set(seedAll.map((v) => v.city))].sort();

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-slate-600">{live ? t("liveMode") : t("demoMode")}</p>

      {personalized && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-700">
          <Sparkles className="h-4 w-4" /> {t("personalized")}
        </p>
      )}

      <div className="mt-5">
        <VacancyFilters professions={professions} cities={cities} />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        {t("found", { count: filtered.length })}
        <span className="ml-2 text-xs text-slate-400">
          {t("source", { source: live ? t("sourceLive") : t("sourceDemo") })}
        </span>
      </p>

      <div className="mt-3 space-y-3">
        {filtered.map((v) => (
          <div key={v.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h3 className="font-semibold text-ink">
                {v.url ? (
                  <a href={v.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand-700">
                    {v.title} <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </a>
                ) : (
                  v.title
                )}
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" /> {v.company}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {v.city}</span>
                <span>{t(`format.${v.format}` as "format.remote")}</span>
                <span>{t(`employment.${v.employment}` as "employment.full")}</span>
                <span>{t("experienceFrom", { years: v.experience })}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">
                {v.salaryMin || v.salaryMax
                  ? `${formatRub(v.salaryMin)} – ${formatRub(v.salaryMax)}`
                  : t("salaryNotSpecified")}
              </p>
              <p className="text-xs text-slate-400">{v.professionTitle}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-slate-500">{t("empty")}</div>
        )}
      </div>
    </div>
  );
}
