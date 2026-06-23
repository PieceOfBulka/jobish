import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminAction } from "@/components/AdminAction";
import { PROFESSION_TITLES } from "@/lib/orientation";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Админ — Профиль пользователя" };

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      subscription: true,
      orientation: true,
      careerGoals: { orderBy: { createdAt: "asc" } },
      roadmaps: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          stages: { include: { steps: true } },
        },
      },
      attempts: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { test: true },
      },
      chatSessions: {
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { messages: true } } },
      },
    },
  });
  if (!user) notFound();

  const roadmap = user.roadmaps[0];
  const steps = roadmap?.stages.flatMap((s) => s.steps) ?? [];
  const done = steps.filter((s) => s.status === "done").length;

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> К списку пользователей
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{user.name}</h1>
          <p className="text-slate-500">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="badge bg-slate-100 text-slate-600">{user.role}</span>
            <span className="badge bg-slate-100 text-slate-600">
              {user.subscription?.plan ?? "free"}
            </span>
            {user.isBlocked ? (
              <span className="badge bg-red-50 text-red-600">заблокирован</span>
            ) : (
              <span className="badge bg-emerald-50 text-emerald-700">активен</span>
            )}
          </div>
        </div>
        {user.role !== "admin" &&
          (user.isBlocked ? (
            <AdminAction
              payload={{ action: "set_blocked", userId: user.id, blocked: false }}
              label="Разблокировать"
            />
          ) : (
            <AdminAction
              payload={{ action: "set_blocked", userId: user.id, blocked: true }}
              label="Заблокировать"
              className="btn-outline text-red-600 hover:bg-red-50"
            />
          ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-ink">Профиль</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Должность</dt>
              <dd className="text-ink">{user.profile?.currentPosition ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Опыт</dt>
              <dd className="text-ink">{user.profile?.experienceMonths ?? 0} мес.</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Трек</dt>
              <dd className="text-ink">
                {user.profile?.targetProfession
                  ? (PROFESSION_TITLES[user.profile.targetProfession] ??
                    user.profile.targetProfession)
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Стрик</dt>
              <dd className="text-ink">{user.profile?.streakDays ?? 0} дн.</dd>
            </div>
          </dl>
          {user.profile?.careerPortrait && (
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
              {user.profile.careerPortrait}
            </p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">Roadmap</h2>
          {roadmap ? (
            <>
              <p className="mt-2 text-sm text-slate-600">{roadmap.title}</p>
              <p className="mt-1 text-sm text-ink">
                Прогресс: {done}/{steps.length} навыков (
                {steps.length ? Math.round((done / steps.length) * 100) : 0}%)
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Карта не создана</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">Профориентация</h2>
          {user.orientation ? (
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              {(JSON.parse(user.orientation.topMatches) as { title: string; match: number }[]).map(
                (m, i) => (
                  <li key={i}>
                    {i + 1}. {m.title} — {m.match}%
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Тест не пройден</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">Карьерные цели</h2>
          {user.careerGoals.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {user.careerGoals.map((g) => (
                <li key={g.id} className="text-slate-600">
                  <span className="font-medium text-ink">{g.title}</span>
                  <span className="text-xs text-slate-400"> · {g.horizon}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Цели не заданы</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">Последние тесты</h2>
          {user.attempts.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {user.attempts.map((a) => (
                <li key={a.id}>
                  {a.test.title}: {a.score}% {a.passed ? "✓" : "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Нет попыток</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-ink">Чаты с коучем</h2>
          {user.chatSessions.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {user.chatSessions.map((s) => (
                <li key={s.id}>
                  {s.title} · {s._count.messages} сообщ.
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Нет диалогов</p>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Зарегистрирован: {user.createdAt.toLocaleDateString("ru-RU")} · ID: {user.id}
      </p>
    </div>
  );
}
