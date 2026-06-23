import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import { AdminBlockButton } from "@/components/AdminBlockButton";

export const dynamic = "force-dynamic";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      subscription: true,
      careerGoals: true,
      roadmaps: {
        take: 1,
        include: { stages: { orderBy: { order: "asc" }, include: { steps: true } } },
      },
      testAttempts: { orderBy: { completedAt: "desc" }, take: 10 },
      chatSessions: {
        take: 1,
        include: { messages: { orderBy: { createdAt: "desc" }, take: 5 } },
      },
    },
  });

  if (!user) notFound();

  const totalSteps = user.roadmaps[0]?.stages.flatMap((s) => s.steps).length ?? 0;
  const doneSteps =
    user.roadmaps[0]?.stages
      .flatMap((s) => s.steps)
      .filter((s) => s.status === "done").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-1 text-sm text-slate-500 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Все пользователи
        </Link>
      </div>

      {/* Заголовок */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <h1 className="text-xl font-bold text-ink">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{user.role}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {user.subscription?.plan ?? "free"}
            </span>
            {user.isVerified && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">Верифицирован</span>
            )}
            {user.isBlocked && (
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs text-red-700">Заблокирован</span>
            )}
          </div>
        </div>
        <AdminBlockButton userId={user.id} isBlocked={user.isBlocked} />
      </div>

      {/* Профиль */}
      {user.profile && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-ink">Профиль</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            {[
              ["Опыт", user.profile.experienceMonths ? `${user.profile.experienceMonths} мес.` : "—"],
              ["Грейд", user.profile.currentPosition ?? "—"],
              ["Специальность", user.profile.currentSpecialty ?? "—"],
              ["Целевая профессия", user.profile.targetProfession ?? "—"],
              ["ЗП-ожидание", user.profile.salaryExpectation ? `${user.profile.salaryExpectation} ₽` : "—"],
              ["Образование", user.profile.educationPlace ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-400">{label}</dt>
                <dd className="font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          {user.profile.careerPortrait && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-medium">Карьерный портрет:</span> {user.profile.careerPortrait}
            </div>
          )}
        </div>
      )}

      {/* Прогресс по roadmap */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 font-semibold text-ink">Прогресс по карте развития</h2>
        {totalSteps > 0 ? (
          <>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">Выполнено шагов</span>
              <span className="font-medium">{doneSteps} / {totalSteps}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${Math.round((doneSteps / totalSteps) * 100)}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-400">Трек не выбран</p>
        )}
      </div>

      {/* Карьерные цели */}
      {user.careerGoals.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-ink">Карьерные цели</h2>
          <ul className="space-y-2">
            {user.careerGoals.map((g) => (
              <li key={g.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-ink">{g.title}</span>
                <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{g.horizon}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* История тестов */}
      {user.testAttempts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-ink">Последние тесты</h2>
          <ul className="divide-y divide-slate-50 text-sm">
            {user.testAttempts.map((a) => {
              let result: { score?: number; passed?: boolean; testTitle?: string } = {};
              try { result = JSON.parse(a.resultPayload); } catch {}
              return (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span className="text-slate-600">{result.testTitle ?? a.testId}</span>
                  {result.score !== undefined && (
                    <span className="font-medium">{result.score}%</span>
                  )}
                  <span className={`text-xs font-medium ${result.passed ? "text-emerald-600" : "text-red-500"}`}>
                    {result.passed ? "Зачёт" : "Незачёт"}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(a.completedAt).toLocaleDateString("ru")}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Последние сообщения в чате */}
      {user.chatSessions.length > 0 && user.chatSessions[0].messages.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-3 font-semibold text-ink">Последние сообщения в чате</h2>
          <ul className="space-y-2 text-sm">
            {user.chatSessions[0].messages.map((m) => (
              <li key={m.id} className={`rounded-lg px-3 py-2 ${m.role === "user" ? "bg-brand-50 text-brand-800" : "bg-slate-50 text-slate-600"}`}>
                <span className="mr-2 text-xs font-medium opacity-60">{m.role === "user" ? "Пользователь" : "Коуч"}:</span>
                {m.content.slice(0, 120)}{m.content.length > 120 ? "…" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
