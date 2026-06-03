import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatRub } from "@/lib/utils";
import { SalaryChart, type SalaryPoint } from "@/components/SalaryChart";
import { ChooseTrackButton } from "@/components/ChooseTrackButton";
import { ExternalLink, Briefcase, FileQuestion } from "lucide-react";

const GRADES = [
  { key: "junior", label: "Junior" },
  { key: "middle", label: "Middle" },
  { key: "senior", label: "Senior" },
] as const;

export default async function ProfessionDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profession = await prisma.profession.findUnique({
    where: { slug },
    include: {
      market: true,
      skills: { orderBy: { order: "asc" } },
      materials: true,
      theoryTests: true,
    },
  });
  if (!profession) notFound();

  const user = await getCurrentUser();
  const profile = user
    ? await prisma.profile.findUnique({ where: { userId: user.id } })
    : null;
  const isCurrent = profile?.targetProfession === slug;

  const trend: SalaryPoint[] = profession.market
    ? JSON.parse(profession.market.salaryTrend)
    : [];
  const companies: { name: string; salary: number; hiring: string }[] =
    profession.market ? JSON.parse(profession.market.topCompanies) : [];

  const hard = profession.skills.filter((s) => s.type === "hard");
  const soft = profession.skills.filter((s) => s.type === "soft");

  return (
    <div className="container-page py-12">
      <Link href="/professions" className="text-sm text-slate-500 hover:text-brand-600">
        ← Все профессии
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <span className="badge bg-brand-50 text-brand-700">{profession.category}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {profession.title}
          </h1>
          <p className="mt-3 text-slate-600">{profession.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <ChooseTrackButton slug={slug} isAuthed={Boolean(user)} isCurrent={isCurrent} />
          {profession.theoryTests[0] && (
            <Link href={user ? `/tests/${profession.theoryTests[0].id}` : "/register"} className="btn-outline">
              <FileQuestion className="h-4 w-4" /> Пробный тест
            </Link>
          )}
        </div>
      </div>

      {/* Market analytics */}
      {profession.market && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">Аналитика рынка</h2>
          <p className="mt-1 text-sm text-slate-400">{profession.market.source}</p>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="card p-5">
              <p className="text-sm text-slate-500">Открытых вакансий</p>
              <p className="mt-1 text-2xl font-bold text-ink">
                {new Intl.NumberFormat("ru-RU").format(profession.market.openVacancies)}
              </p>
              <p className="mt-3 text-sm text-slate-500">Спрос на рынке</p>
              <p className="mt-1 text-lg font-semibold capitalize text-brand-700">
                {profession.market.demandLevel}
              </p>
            </div>
            <div className="card grid grid-cols-3 gap-2 p-5">
              {GRADES.map((g) => (
                <div key={g.key}>
                  <p className="text-xs text-slate-500">{g.label}</p>
                  <p className="mt-1 text-sm font-bold text-ink sm:text-base">
                    {formatRub(
                      profession.market![
                        `salary${g.label}` as "salaryJunior" | "salaryMiddle" | "salarySenior"
                      ],
                    )}
                  </p>
                </div>
              ))}
              <div className="col-span-3 mt-2">
                <p className="mb-1 text-xs text-slate-500">Динамика зарплат (6 мес.)</p>
                <SalaryChart data={trend} />
              </div>
            </div>
            <div className="card p-5">
              <p className="mb-3 text-sm font-semibold text-ink">Топ-компании по найму</p>
              <ul className="space-y-3">
                {companies.map((c) => (
                  <li key={c.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Briefcase className="h-4 w-4 text-brand-500" /> {c.name}
                    </span>
                    <span className="text-right">
                      <span className="block font-semibold text-ink">{formatRub(c.salary)}</span>
                      <span className="text-xs text-slate-400">найм {c.hiring}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Skills by grade */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-ink">Необходимые навыки</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="font-semibold text-ink">Hard skills по грейдам</h3>
            <div className="mt-4 space-y-4">
              {GRADES.map((g) => {
                const list = hard.filter((s) => s.grade === g.key);
                if (!list.length) return null;
                return (
                  <div key={g.key}>
                    <p className="text-xs font-medium uppercase tracking-wide text-brand-600">{g.label}</p>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {list.map((s) => (
                        <span key={s.id} className="badge bg-slate-100 text-slate-700">{s.name}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-ink">Soft skills</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {soft.map((s) => (
                <span key={s.id} className="badge bg-accent-400/15 text-accent-600">{s.name}</span>
              ))}
            </div>
            <h3 className="mt-6 font-semibold text-ink">Материалы для старта</h3>
            <ul className="mt-3 space-y-2">
              {profession.materials.slice(0, 5).map((m) => (
                <li key={m.id}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-sm text-slate-700 hover:text-brand-700">
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600" />
                    <span>{m.title}</span>
                    <span className="text-xs text-slate-400">· {m.provider}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
