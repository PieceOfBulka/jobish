import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { filterVacancies, FORMAT_LABELS, EMPLOYMENT_LABELS, type Vacancy } from "@/lib/vacancies";
import { isHhEnabled, fetchHhVacancies } from "@/lib/hh";
import { formatRub } from "@/lib/utils";
import { VacancyFilters } from "@/components/VacancyFilters";
import { Briefcase, MapPin, Sparkles, ExternalLink } from "lucide-react";

export const metadata = { title: "Вакансии — Jobish" };

type Row = Vacancy & { professionTitle: string; url?: string };

export default async function VacanciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
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

  // ФТ-3.3 — персонализация: без фильтров показываем по целевому треку
  const noFilters = Object.values(sp).every((v) => !v);
  const personalized = noFilters && Boolean(profile?.targetProfession);
  const targetSlug = sp.professionSlug || (personalized ? profile?.targetProfession ?? undefined : undefined);
  const targetTitle = professions.find((p) => p.slug === targetSlug)?.title;

  const salaryFrom = sp.salaryFrom ? Number(sp.salaryFrom) : undefined;
  const salaryTo = sp.salaryTo ? Number(sp.salaryTo) : undefined;
  const experienceMax = sp.experienceMax ? Number(sp.experienceMax) : undefined;

  // 1) Пытаемся отдать живые вакансии hh.ru (нужна выбранная профессия для текст-запроса)
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
      // hh уже отфильтровал по городу/опыту/занятости — добиваем клиентскими фильтрами
      filtered = filterVacancies(liveRows, {
        company: sp.company || undefined,
        format: sp.format || undefined,
        salaryTo,
      });
      live = true;
    }
  }

  // 2) Фолбэк — сид-база с полным набором фильтров
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
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">Поиск вакансий</h1>
      <p className="mt-1 text-slate-600">
        {live
          ? "Живые вакансии с официального API hh.ru. Фильтруйте по городу, зарплате, формату и опыту."
          : "Демо-база (выберите профессию для живых вакансий с hh.ru). Фильтруйте по профессии, городу, зарплате и опыту."}
      </p>

      {personalized && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm text-brand-700">
          <Sparkles className="h-4 w-4" /> Показаны вакансии по вашему треку.
          Измените фильтры, чтобы посмотреть другие.
        </p>
      )}

      <div className="mt-5">
        <VacancyFilters professions={professions} cities={cities} />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Найдено: {filtered.length}
        <span className="ml-2 text-xs text-slate-400">
          · источник: {live ? "hh.ru (официальный API)" : "демо-база"}
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
                <span>{FORMAT_LABELS[v.format] ?? v.format}</span>
                <span>{EMPLOYMENT_LABELS[v.employment] ?? v.employment}</span>
                <span>опыт от {v.experience} лет</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-ink">
                {v.salaryMin || v.salaryMax
                  ? `${formatRub(v.salaryMin)} – ${formatRub(v.salaryMax)}`
                  : "з/п не указана"}
              </p>
              <p className="text-xs text-slate-400">{v.professionTitle}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-10 text-center text-slate-500">
            По заданным фильтрам вакансий не найдено. Попробуйте смягчить условия.
          </div>
        )}
      </div>
    </div>
  );
}
